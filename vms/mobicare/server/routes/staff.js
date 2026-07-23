// Agent back-office (role staff|admin). Planted: V11 — bill/notification template
// preview renders staff input with Nunjucks -> SSTI RCE. Ticket bodies + device
// nicknames render unsanitised in the review queue (V10 blind XSS). /api/collect
// is the in-band catcher.
const express = require('express')
const router = express.Router()
const { db, requireStaff, requireAdmin, subscriber } = require('./_util')
const { render } = require('../templates')

router.get('/staff/dashboard', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json({
    subscribers: db.prepare("SELECT COUNT(*) c FROM subscribers WHERE role='subscriber'").get().c,
    lines: db.prepare('SELECT COUNT(*) c FROM lines_').get().c,
    open_tickets: db.prepare("SELECT COUNT(*) c FROM tickets WHERE status='open'").get().c,
    overdue_bills: db.prepare("SELECT COUNT(*) c FROM bills WHERE status='due'").get().c,
  })
})
router.get('/staff/subscribers', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json(db.prepare('SELECT id,username,name,msisdn,email,role,plan,tier,kyc_status FROM subscribers ORDER BY id').all())
})
router.get('/staff/subscribers/:id', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  const s = subscriber(req.params.id); if (!s) return res.status(404).json({ error: 'not found' })
  res.json({ ...s, notes: db.prepare('SELECT author,note,created FROM staff_notes WHERE subscriber_id=?').all(s.id) })
})
router.get('/staff/review', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json({ tickets: db.prepare('SELECT id,subscriber_id,subject,body,status,created FROM tickets ORDER BY id DESC LIMIT 40').all() })
})
router.get('/staff/audit', (req, res) => { const u = requireStaff(req, res); if (!u) return; res.json(db.prepare('SELECT actor,action,detail,created FROM audit ORDER BY id DESC').all()) })

router.get('/staff/report/template', (req, res) => { const u = requireStaff(req, res); if (!u) return; res.json({ template: db.prepare("SELECT value FROM config WHERE key='report_template'").get().value }) })
router.post('/staff/report/preview', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  const tpl = (req.body || {}).template != null ? String(req.body.template) : db.prepare("SELECT value FROM config WHERE key='report_template'").get().value
  const ctx = (req.body || {}).sample || { name: 'Demo User', plan: 'Unlimited 5G', amount: 61.20 }
  try { res.json({ ok: true, rendered: render(tpl, ctx) }) } catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})

router.get('/admin/config', (req, res) => { const u = requireAdmin(req, res); if (!u) return; res.json(Object.fromEntries(db.prepare('SELECT key,value FROM config').all().map(r => [r.key, r.value]))) })
router.post('/admin/config', (req, res) => {
  const u = requireAdmin(req, res); if (!u) return
  for (const [k, v] of Object.entries(req.body || {})) db.prepare('INSERT INTO config(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, String(v))
  res.json({ ok: true })
})

router.all('/collect', (req, res) => {
  const data = req.method === 'GET' ? JSON.stringify(req.query) : JSON.stringify(req.body || {})
  if (req.method === 'GET' && Object.keys(req.query).length === 0) return res.json(db.prepare('SELECT id,data,created FROM collect ORDER BY id DESC LIMIT 50').all())
  db.prepare("INSERT INTO collect(data,ip,created) VALUES (?,?,datetime('now'))").run(String(data).slice(0, 3000), req.ip || '')
  res.json({ ok: true })
})

module.exports = router
