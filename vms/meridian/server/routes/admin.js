// Admin console (role=admin gated). Planted V11 — the login-page branding and
// welcome-email templates are rendered with Nunjucks over admin input -> SSTI RCE:
//   {{range.constructor("return global.process.mainModule.require('child_process').execSync('id')")()}}
const express = require('express')
const router = express.Router()
const { db, requireAdmin } = require('./_util')
const { render } = require('../templates')

router.get('/admin/overview', (req, res) => {
  const a = requireAdmin(req, res); if (!a) return
  res.json({
    users: db.prepare('SELECT COUNT(*) c FROM users').get().c,
    clients: db.prepare('SELECT COUNT(*) c FROM clients').get().c,
    active_tokens: db.prepare('SELECT COUNT(*) c FROM tokens').get().c,
    consents: db.prepare('SELECT COUNT(*) c FROM consents').get().c,
  })
})
router.get('/admin/users', (req, res) => {
  const a = requireAdmin(req, res); if (!a) return
  res.json(db.prepare('SELECT id,username,name,email,role,department,email_verified,mfa_enabled FROM users').all())
})
router.get('/admin/clients', (req, res) => {
  const a = requireAdmin(req, res); if (!a) return
  res.json(db.prepare('SELECT client_id,name,client_secret,redirect_uris,allowed_scopes FROM clients').all())
})
router.get('/admin/config', (req, res) => {
  const a = requireAdmin(req, res); if (!a) return
  res.json(Object.fromEntries(db.prepare('SELECT key,value FROM config').all().map(r => [r.key, r.value])))
})
router.post('/admin/config', (req, res) => {
  const a = requireAdmin(req, res); if (!a) return
  for (const [k, v] of Object.entries(req.body || {})) db.prepare('INSERT INTO config(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, String(v))
  res.json({ ok: true })
})
router.get('/admin/audit', (req, res) => {
  const a = requireAdmin(req, res); if (!a) return
  res.json(db.prepare('SELECT actor,action,detail,created FROM audit ORDER BY id DESC').all())
})

// V11 — branding / email template previews render admin input server-side.
router.post('/admin/branding/preview', (req, res) => {
  const a = requireAdmin(req, res); if (!a) return
  const tpl = (req.body || {}).template != null ? String(req.body.template) : db.prepare("SELECT value FROM config WHERE key='branding_template'").get().value
  try { res.json({ ok: true, rendered: render(tpl, { org: 'Meridian' }) }) }
  catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})
router.post('/admin/email/preview', (req, res) => {
  const a = requireAdmin(req, res); if (!a) return
  const tpl = (req.body || {}).template != null ? String(req.body.template) : db.prepare("SELECT value FROM config WHERE key='welcome_email_template'").get().value
  try { res.json({ ok: true, rendered: render(tpl, { name: 'User', email: 'user@meridian.id' }) }) }
  catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})

module.exports = router
