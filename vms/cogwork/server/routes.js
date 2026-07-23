// Cogwork routes. Planted: V1 (workflow import -> node-serialize deserialization
// RCE), V2 (settings merge -> prototype pollution -> auth bypass), V4 (workflow
// IDOR incl. private secrets), V5 (workflow-search SQLi), V6 (mass-assign ->
// admin), V7 (export path traversal), V8 (JWT forge via leaked secret), V9 (blind
// XSS in workflow name), V-redir.
const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const serialize = require('node-serialize')
const { db } = require('./db')
const { SECRET, sign, userFromReq, bcryptCheck, md5 } = require('./auth')
const { merge } = require('./merge')

const settingsStore = {}   // per-process settings the PP payload gets merged into
function authUser(req, res) { const u = userFromReq(req); if (!u) { res.status(401).json({ error: 'login required' }); return null } return u }
// V2 gadget: a fresh object's inherited isAdmin is honoured after prototype pollution.
function admin(req, res) {
  const u = userFromReq(req); if (!u) { res.status(401).json({ error: 'login required' }); return null }
  const check = {}
  if (u.role === 'admin' || check.isAdmin === true) return u
  res.status(403).json({ error: 'admin only' }); return null
}
const user = (id) => db.prepare('SELECT * FROM users WHERE id=?').get(id)
const pub = (u) => ({ id: u.id, username: u.username, role: u.role, email: u.email })

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username || '')
  if (!u || !(u.hash_algo === 'md5' ? md5(password || '') === u.password : bcryptCheck(password || '', u.password))) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ access: sign(u), user: pub(u) })
})
router.get('/me', (req, res) => { const u = authUser(req, res); if (!u) return; res.json(pub(user(u.id))) })
// V6 — mass assignment.
router.patch('/me', (req, res) => { const u = authUser(req, res); if (!u) return; const d = user(u.id); for (const k of ['email', 'role']) if (k in (req.body || {})) db.prepare(`UPDATE users SET ${k}=? WHERE id=?`).run(req.body[k], u.id); res.json(pub(user(u.id))) })
// V2 — settings update merges request JSON into a store with a vulnerable merge.
router.post('/me/settings', (req, res) => {
  const u = authUser(req, res); if (!u) return
  try { merge(settingsStore, (req.body || {}).settings || {}); res.json({ ok: true, settings: settingsStore }) } catch (e) { res.status(400).json({ error: e.message }) }
})

// ---- workflows ---------------------------------------------------------------
router.get('/workflows', (req, res) => { const u = authUser(req, res); if (!u) return; res.json(db.prepare('SELECT id,name,description,private FROM workflows WHERE owner=?').all(u.username)) })
// V5 — workflow-search SQLi (declared before /workflows/:id so it isn't shadowed).
router.get('/workflows/search', (req, res) => {
  const u = authUser(req, res); if (!u) return
  const q = req.query.q != null ? String(req.query.q) : ''
  const sql = `SELECT id, name, description FROM workflows WHERE name LIKE '%${q}%'`
  try { res.json(db.prepare(sql).all()) } catch (e) { res.status(400).json({ error: 'search failed', detail: e.message, sql }) }
})
// V4 — IDOR: any workflow (private configs hold secrets).
router.get('/workflows/:id', (req, res) => { const u = authUser(req, res); if (!u) return; const w = db.prepare('SELECT * FROM workflows WHERE id=?').get(req.params.id); if (!w) return res.status(404).json({ error: 'not found' }); res.json(w) })
router.post('/workflows', (req, res) => {
  const u = authUser(req, res); if (!u) return
  const id = db.prepare("INSERT INTO workflows(owner,name,description,config,private) VALUES (?,?,?,?,?)").run(u.username, String((req.body || {}).name || ''), String((req.body || {}).description || ''), JSON.stringify((req.body || {}).config || {}), (req.body || {}).private ? 1 : 0).lastInsertRowid
  res.json({ ok: true, id })
})
// V1 — workflow import: node-serialize.unserialize evaluates function markers -> RCE.
router.post('/workflows/import', (req, res) => {
  const u = authUser(req, res); if (!u) return
  const data = (req.body || {}).data
  if (typeof data !== 'string') return res.status(400).json({ error: 'data (serialized string) required' })
  try { res.json({ ok: true, imported: serialize.unserialize(data) }) } catch (e) { res.status(400).json({ error: 'import failed', detail: e.message }) }
})

// V7 — export path traversal.
const TPL = path.join(__dirname, 'exports')
router.get('/export', (req, res) => {
  const u = authUser(req, res); if (!u) return
  const file = req.query.file; if (!file) return res.json({ available: fs.readdirSync(TPL) })
  try { res.type('text/plain').send(fs.readFileSync(path.join(TPL, file), 'utf8')) } catch (e) { res.status(404).json({ error: 'not found', detail: e.message }) }
})

// ---- admin (guarded by admin() — bypassable via V2 prototype pollution) ------
router.get('/admin/overview', (req, res) => { const u = admin(req, res); if (!u) return; res.json({ users: db.prepare('SELECT COUNT(*) c FROM users').get().c, workflows: db.prepare('SELECT COUNT(*) c FROM workflows').get().c }) })
router.get('/admin/users', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,username,role,email FROM users').all()) })
router.get('/admin/workflows', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,owner,name,description FROM workflows ORDER BY id DESC').all()) })   // V9 — names rendered v-html in admin
router.get('/continue', (req, res) => res.redirect(req.query.next || '/'))   // V-redir

module.exports = router
