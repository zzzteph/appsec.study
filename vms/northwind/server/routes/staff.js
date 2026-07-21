// Back-office (role staff|admin). Planted: V12 — the report/statement template
// preview renders staff input with Nunjucks -> SSTI RCE. Transfer memos and
// support tickets are shown for review and rendered unsanitised by the SPA,
// which is where a blind-XSS payload (V11) detonates in a staff session.
// /api/collect is the in-band blind-XSS catcher.
const express = require('express')
const router = express.Router()
const { db, requireStaff, requireAdmin, customer } = require('./_util')
const { render } = require('../templates')
const mailer = require('../mailer')

router.get('/staff/dashboard', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json({
    customers: db.prepare("SELECT COUNT(*) c FROM customers WHERE role='customer'").get().c,
    accounts: db.prepare('SELECT COUNT(*) c FROM accounts').get().c,
    deposits: db.prepare('SELECT COALESCE(SUM(balance),0) s FROM accounts').get().s,
    open_tickets: db.prepare("SELECT COUNT(*) c FROM tickets WHERE status='open'").get().c,
  })
})
router.get('/staff/customers', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json(db.prepare('SELECT id,username,name,email,phone,role,kyc_status,tier,daily_limit FROM customers ORDER BY id').all())
})
router.get('/staff/customers/:id', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  const c = customer(req.params.id); if (!c) return res.status(404).json({ error: 'not found' })
  res.json({ ...c, accounts: db.prepare('SELECT * FROM accounts WHERE customer_id=?').all(c.id), notes: db.prepare('SELECT author,note,created FROM staff_notes WHERE customer_id=?').all(c.id) })
})
// Review queue — memos + ticket bodies rendered unsanitised in the SPA (V11).
router.get('/staff/review', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json({
    transfers: db.prepare('SELECT id,from_account,to_account,amount,memo,created FROM transfers ORDER BY id DESC LIMIT 40').all(),
    tickets: db.prepare('SELECT id,customer_id,subject,body,status,created FROM tickets ORDER BY id DESC LIMIT 30').all(),
  })
})
router.get('/staff/audit', (req, res) => { const u = requireStaff(req, res); if (!u) return; res.json(db.prepare('SELECT actor,action,detail,created FROM audit ORDER BY id DESC').all()) })
router.post('/staff/broadcast', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  mailer.bind(db)
  for (const c of db.prepare("SELECT id FROM customers WHERE role='customer'").all()) mailer.deliver(c.id, { subject: String((req.body || {}).subject || 'Northwind'), body: String((req.body || {}).body || '') })
  res.json({ ok: true })
})

// V12 — report/statement template preview (SSTI -> RCE).
router.get('/staff/report/template', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  res.json({ template: db.prepare("SELECT value FROM config WHERE key='report_template'").get().value })
})
router.post('/staff/report/preview', (req, res) => {
  const u = requireStaff(req, res); if (!u) return
  const tpl = (req.body || {}).template != null ? String(req.body.template) : db.prepare("SELECT value FROM config WHERE key='report_template'").get().value
  const ctx = (req.body || {}).sample || { name: 'Demo Customer', balance: 1240.55 }
  try { res.json({ ok: true, rendered: render(tpl, ctx) }) }
  catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})

// ---- admin -------------------------------------------------------------------
router.get('/admin/config', (req, res) => { const u = requireAdmin(req, res); if (!u) return; res.json(Object.fromEntries(db.prepare('SELECT key,value FROM config').all().map(r => [r.key, r.value]))) })
router.post('/admin/config', (req, res) => {
  const u = requireAdmin(req, res); if (!u) return
  for (const [k, v] of Object.entries(req.body || {})) db.prepare('INSERT INTO config(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, String(v))
  res.json({ ok: true })
})

// ---- in-band blind-XSS catcher ----------------------------------------------
router.all('/collect', (req, res) => {
  const data = req.method === 'GET' ? JSON.stringify(req.query) : JSON.stringify(req.body || {})
  if (req.method === 'GET' && Object.keys(req.query).length === 0) return res.json(db.prepare('SELECT id,data,created FROM collect ORDER BY id DESC LIMIT 50').all())
  db.prepare("INSERT INTO collect(data,ip,created) VALUES (?,?,datetime('now'))").run(String(data).slice(0, 3000), req.ip || '')
  res.json({ ok: true })
})

module.exports = router
