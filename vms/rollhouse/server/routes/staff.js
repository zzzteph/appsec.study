// Staff & admin console (role-gated). Planted sinks:
//  V13 — /staff/promos/formula/preview evaluates a bonus formula with Function()
//        -> process.mainModule.require('child_process').execSync('id') = RCE (staff)
//  V14 — /admin/email/preview renders a template with Nunjucks renderString
//        -> {{range.constructor("return process...")()}} = RCE (admin)
// The moderation feed serves raw chat/feed that the SPA renders unsanitised,
// which is where a blind-XSS payload (V11) detonates in a staff session.
const express = require('express')
const router = express.Router()
const { db, requireStaff, requireAdmin, player } = require('./_util')
const { evalFormula, renderEmail } = require('../templates')
const mailer = require('../mailer')

// ---- staff -------------------------------------------------------------------
router.get('/staff/dashboard', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json({
    players: db.prepare("SELECT COUNT(*) c FROM players WHERE role='player'").get().c,
    deposits_today: db.prepare("SELECT COALESCE(SUM(amount),0) s FROM ledger WHERE kind='deposit'").get().s,
    withdrawals_today: db.prepare("SELECT COALESCE(-SUM(amount),0) s FROM ledger WHERE kind='withdraw'").get().s,
    open_tickets: db.prepare("SELECT COUNT(*) c FROM tickets WHERE status='open'").get().c,
    pending_kyc: db.prepare("SELECT COUNT(*) c FROM kyc_docs WHERE status='pending'").get().c,
  })
})
router.get('/staff/players', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  const q = String(req.query.q || '')
  const rows = db.prepare(`SELECT id,username,display_name,email,role,vip_tier,kyc_status,balance,country,created
    FROM players WHERE username LIKE ? OR email LIKE ? ORDER BY id LIMIT 100`).all('%' + q + '%', '%' + q + '%')
  res.json(rows)
})
router.get('/staff/players/:id', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  const p = player(req.params.id); if (!p) return res.status(404).json({ error: 'not found' })
  res.json({ ...p, notes: db.prepare('SELECT author,note,created FROM staff_notes WHERE player_id = ?').all(p.id) })
})
router.get('/staff/kyc-queue', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json(db.prepare("SELECT id,player_id,type,filename,status,created FROM kyc_docs WHERE status='pending' ORDER BY id").all())
})
router.post('/staff/kyc/:id/approve', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  db.prepare("UPDATE kyc_docs SET status='approved' WHERE id = ?").run(req.params.id)
  res.json({ ok: true })
})
router.get('/staff/moderation', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json({
    chat: db.prepare('SELECT id,username,message,created FROM chat ORDER BY id DESC LIMIT 40').all(),
    feed: db.prepare('SELECT id,username,game,amount,note,created FROM feed ORDER BY id DESC LIMIT 30').all(),
  })
})
router.get('/staff/audit', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json(db.prepare('SELECT actor,action,detail,created FROM audit ORDER BY id DESC LIMIT 50').all())
})
router.post('/staff/broadcast', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  const { subject, body } = req.body || {}
  mailer.bind(db)
  for (const p of db.prepare("SELECT id FROM players WHERE role='player'").all()) mailer.deliver(p.id, { subject: String(subject || 'RollHouse'), body: String(body || '') })
  res.json({ ok: true, sent: db.prepare("SELECT COUNT(*) c FROM players WHERE role='player'").get().c })
})

// Bonus formula (stored) + V13 preview sink.
router.get('/staff/promos/formula', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json({ formula: db.prepare("SELECT value FROM config WHERE key='bonus_formula'").get()?.value || 'deposit * 0.1 + streak' })
})
router.post('/staff/promos/formula/preview', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  const formula = String((req.body || {}).formula || '0')
  const sample = (req.body || {}).sample || { deposit: 100, streak: 3, tier: 2, losses: 50 }
  try {
    const result = evalFormula(formula, { ...sample, player: sample.player || { name: 'demo' } })
    res.json({ ok: true, formula, result: String(result) })
  } catch (e) {
    res.status(400).json({ error: 'formula error', detail: e.message })
  }
})

// ---- admin -------------------------------------------------------------------
router.get('/admin/config', (req, res) => {
  const u = requireAdmin(req, res); if (!u) return
  const rows = db.prepare('SELECT key,value FROM config').all()
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])))
})
router.post('/admin/config', (req, res) => {
  const u = requireAdmin(req, res); if (!u) return
  for (const [k, v] of Object.entries(req.body || {})) db.prepare('INSERT INTO config(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, String(v))
  res.json({ ok: true })
})
// V14 — promo email template rendered with Nunjucks over admin input -> SSTI RCE.
router.post('/admin/email/preview', (req, res) => {
  const u = requireAdmin(req, res); if (!u) return
  const template = (req.body || {}).template != null
    ? String((req.body).template)
    : db.prepare("SELECT value FROM config WHERE key='promo_email_template'").get().value
  const context = (req.body || {}).context || { name: 'Player', bonus: 25 }
  try {
    res.json({ ok: true, rendered: renderEmail(template, context) })
  } catch (e) {
    res.status(400).json({ error: 'template error', detail: e.message })
  }
})

module.exports = router
