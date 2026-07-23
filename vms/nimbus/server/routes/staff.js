// Admin (role=admin). Planted V13 — share-notification template preview renders
// admin input with Nunjucks -> SSTI RCE. Comments/filenames render unsanitised in
// the admin file review (V6 blind XSS). /api/collect is the in-band catcher.
const express = require('express')
const router = express.Router()
const { db, requireAdmin } = require('./_util')
const { render } = require('../templates')

router.get('/admin/overview', (req, res) => {
  const u = requireAdmin(req, res); if (!u) return
  res.json({ users: db.prepare('SELECT COUNT(*) c FROM users').get().c, files: db.prepare('SELECT COUNT(*) c FROM files').get().c, shares: db.prepare('SELECT COUNT(*) c FROM shares').get().c })
})
router.get('/admin/users', (req, res) => { const u = requireAdmin(req, res); if (!u) return; res.json(db.prepare('SELECT id,username,name,email,role,quota_gb FROM users').all()) })
router.get('/admin/files', (req, res) => { const u = requireAdmin(req, res); if (!u) return; res.json(db.prepare('SELECT id,owner_id,name,mime,size FROM files ORDER BY id DESC LIMIT 100').all()) })
router.get('/admin/comments', (req, res) => { const u = requireAdmin(req, res); if (!u) return; res.json(db.prepare('SELECT id,file_id,author_name,body,created FROM comments ORDER BY id DESC LIMIT 50').all()) })
router.get('/admin/config', (req, res) => { const u = requireAdmin(req, res); if (!u) return; res.json(Object.fromEntries(db.prepare('SELECT key,value FROM config').all().map(r => [r.key, r.value]))) })
router.post('/admin/config', (req, res) => {
  const u = requireAdmin(req, res); if (!u) return
  for (const [k, v] of Object.entries(req.body || {})) db.prepare('INSERT INTO config(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, String(v))
  res.json({ ok: true })
})
router.post('/admin/notify/preview', (req, res) => {
  const u = requireAdmin(req, res); if (!u) return
  const tpl = (req.body || {}).template != null ? String(req.body.template) : db.prepare("SELECT value FROM config WHERE key='share_notification_template'").get().value
  const ctx = (req.body || {}).sample || { name: 'Demo User', sharer: 'Alice', file: 'Q3 Roadmap.docx' }
  try { res.json({ ok: true, rendered: render(tpl, ctx) }) } catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})
router.all('/collect', (req, res) => {
  const data = req.method === 'GET' ? JSON.stringify(req.query) : JSON.stringify(req.body || {})
  if (req.method === 'GET' && Object.keys(req.query).length === 0) return res.json(db.prepare('SELECT id,data,created FROM collect ORDER BY id DESC LIMIT 50').all())
  db.prepare("INSERT INTO collect(data,ip,created) VALUES (?,?,datetime('now'))").run(String(data).slice(0, 3000), req.ip || ''); res.json({ ok: true })
})
module.exports = router
