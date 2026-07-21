// Platform admin (superadmin) — the deepest tier, reachable by forging a token
// with the leaked signing secret (V10). /api/collect is the in-band blind-XSS
// catcher (comment payloads (V7) render unsanitised in the ticket board).
const express = require('express')
const router = express.Router()
const { db, requireSuperadmin } = require('./_util')

router.get('/admin/overview', (req, res) => {
  const u = requireSuperadmin(req, res); if (!u) return
  res.json({
    orgs: db.prepare('SELECT COUNT(*) c FROM orgs').get().c,
    users: db.prepare('SELECT COUNT(*) c FROM users').get().c,
    projects: db.prepare('SELECT COUNT(*) c FROM projects').get().c,
    tickets: db.prepare('SELECT COUNT(*) c FROM tickets').get().c,
  })
})
router.get('/admin/orgs', (req, res) => { const u = requireSuperadmin(req, res); if (!u) return; res.json(db.prepare('SELECT * FROM orgs').all()) })
router.get('/admin/users', (req, res) => { const u = requireSuperadmin(req, res); if (!u) return; res.json(db.prepare('SELECT id,username,name,email,platform_role FROM users').all()) })
router.get('/admin/config', (req, res) => { const u = requireSuperadmin(req, res); if (!u) return; res.json(Object.fromEntries(db.prepare('SELECT key,value FROM config').all().map(r => [r.key, r.value]))) })
router.post('/admin/config', (req, res) => {
  const u = requireSuperadmin(req, res); if (!u) return
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
