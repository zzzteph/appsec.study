// Prism routes. Planted: V1 (query-builder SQLi), V2 (report-template SSTI -> RCE),
// V3 (saved-query/dashboard name stored XSS in admin review), V4 (dashboard IDOR),
// V5 (CSV export formula injection), V6 (dataset IDOR), V7 (mass-assignment ->
// admin), V8 (report download traversal -> secret), V9 (JWT forge via leaked
// secret), V-csrf/redir.
const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { db } = require('./db')
const { SECRET, sign, verify, userFromReq, sidFromReq, bcryptHash, bcryptCheck, md5 } = require('./auth')
const jwt = require('jsonwebtoken')
const { render } = require('./templates')

function auth(req, res) { const u = userFromReq(req); if (!u) { res.status(401).json({ error: 'unauthorized' }); return null } return u }
function admin(req, res) { const u = auth(req, res); if (!u) return null; if (u.role !== 'admin') { res.status(403).json({ error: 'admin only' }); return null } return u }
const user = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id)
const meCard = (u) => ({ id: u.id, uuid: u.uuid, username: u.username, email: u.email, name: u.name, role: u.role, avatar_seed: u.avatar_seed })

// ---- auth --------------------------------------------------------------------
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '')
  if (!u || !(u.hash_algo === 'md5' ? md5(password || '') === u.password : bcryptCheck(password || '', u.password))) return res.status(401).json({ error: 'invalid credentials' })
  res.setHeader('Set-Cookie', `pr_sid=${jwt.sign({ id: u.id, sid: true }, SECRET, { expiresIn: '7d' })}; Path=/; SameSite=Lax; Max-Age=604800`)
  res.json({ access: sign(u), user: meCard(u) })
})
router.post('/auth/register', (req, res) => {
  const { username, password, email, name } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'username and password required' })
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) return res.status(409).json({ error: 'username taken' })
  const id = db.prepare('SELECT MAX(id) m FROM users').get().m + 1
  db.prepare("INSERT INTO users(id,uuid,username,email,password,hash_algo,role,name,avatar_seed,created) VALUES (?,?,?,?,?, 'bcrypt','analyst',?,?, datetime('now'))").run(id, 'usr_' + id, username, email || '', bcryptHash(password), name || username, username)
  res.json({ access: sign(user(id)), user: meCard(user(id)) })
})
router.get('/me', (req, res) => { const u = auth(req, res); if (!u) return; res.json(meCard(user(u.id))) })
// V7 — mass assignment: role honored.
router.patch('/me', (req, res) => {
  const u = auth(req, res); if (!u) return
  const A = ['name', 'role']; const sets = [], vals = []
  for (const k of Object.keys(req.body || {})) if (A.includes(k)) { sets.push(`${k}=?`); vals.push(req.body[k]) }
  if (sets.length) { vals.push(u.id); db.prepare(`UPDATE users SET ${sets.join(',')} WHERE id=?`).run(...vals) }
  res.json(meCard(user(u.id)))
})
// V-csrf — cookie-session email change.
router.post('/me/email', (req, res) => {
  const d = sidFromReq(req) ? verify(sidFromReq(req)) : null
  if (!d || !d.id) return res.status(401).json({ error: 'no session' })
  db.prepare('UPDATE users SET email=? WHERE id=?').run((req.body || {}).email || '', d.id); res.json({ ok: true })
})
router.get('/continue', (req, res) => res.redirect(req.query.next || '/'))  // V-redir

// ---- datasets & query builder ------------------------------------------------
router.get('/datasets', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT id,name,table_name,description FROM datasets').all()) })
// V6 — IDOR: any dataset.
router.get('/datasets/:id', (req, res) => { const u = auth(req, res); if (!u) return; const d = db.prepare('SELECT * FROM datasets WHERE id=?').get(req.params.id); if (!d) return res.status(404).json({ error: 'not found' }); res.json(d) })

// V1 — query builder: the filter expression is concatenated into SQL.
router.post('/query/run', (req, res) => {
  const u = auth(req, res); if (!u) return
  const where = (req.body || {}).where != null ? String(req.body.where) : '1=1'
  const sql = `SELECT id, region, product, amount, rep FROM sales WHERE ${where} LIMIT 200`
  try { res.json({ rows: db.prepare(sql).all() }) } catch (e) { res.status(400).json({ error: 'query failed', detail: e.message, sql }) }
})

// ---- saved queries -----------------------------------------------------------
router.get('/queries', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT id,name,description,created FROM queries WHERE owner_id=?').all(u.id)) })
router.post('/queries', (req, res) => {
  const u = auth(req, res); if (!u) return
  const id = db.prepare("INSERT INTO queries(owner_id,name,spec,description,created) VALUES (?,?,?,?, datetime('now'))").run(u.id, String((req.body || {}).name || '').slice(0, 160), String((req.body || {}).spec || ''), String((req.body || {}).description || '').slice(0, 300)).lastInsertRowid
  res.json({ ok: true, id })
})
// V5 — CSV export: cell values written raw (no formula-injection guard).
router.get('/export/csv', (req, res) => {
  const u = userFromReq(req) || (req.query.t ? verify(String(req.query.t)) : null)  // ?t= token for browser download
  if (!u) { res.status(401).json({ error: 'unauthorized' }); return }
  const rows = db.prepare('SELECT name,description,created FROM queries WHERE owner_id=?').all(u.id)
  let csv = 'name,description,created\n'
  for (const r of rows) csv += `${r.name},${r.description},${r.created}\n`   // no escaping / no leading-'=' guard
  res.type('text/csv').send(csv)
})

// ---- dashboards --------------------------------------------------------------
router.get('/dashboards', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT id,name,is_public,description FROM dashboards WHERE owner_id=?').all(u.id)) })
// V4 — IDOR: any dashboard (incl. private/confidential).
router.get('/dashboards/:id', (req, res) => { const u = auth(req, res); if (!u) return; const d = db.prepare('SELECT * FROM dashboards WHERE id=?').get(req.params.id); if (!d) return res.status(404).json({ error: 'not found' }); res.json(d) })
router.get('/shared/:token', (req, res) => { const d = db.prepare('SELECT id,name,description FROM dashboards WHERE share_token=?').get(req.params.token); res.json(d || { error: 'not found' }) })

// ---- report builder ----------------------------------------------------------
router.get('/reports/template', (req, res) => { const u = auth(req, res); if (!u) return; res.json({ template: db.prepare("SELECT value FROM config WHERE key='report_template'").get().value }) })
// V2 — report template rendered server-side (Nunjucks) -> SSTI RCE.
router.post('/reports/preview', (req, res) => {
  const u = auth(req, res); if (!u) return
  const tpl = (req.body || {}).template != null ? String(req.body.template) : db.prepare("SELECT value FROM config WHERE key='report_template'").get().value
  const ctx = (req.body || {}).sample || { title: 'Sales', total: 123456, rows: 40 }
  try { res.json({ ok: true, rendered: render(tpl, ctx) }) } catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})
// V8 — report download path traversal.
const REPORTS = path.join(__dirname, 'reports')
router.get('/reports/download', (req, res) => {
  const u = auth(req, res); if (!u) return
  const file = req.query.file; if (!file) return res.json({ available: fs.readdirSync(REPORTS) })
  try { res.type('text/plain').send(fs.readFileSync(path.join(REPORTS, file), 'utf8')) } catch (e) { res.status(404).json({ error: 'not found', detail: e.message }) }
})

// ---- admin -------------------------------------------------------------------
router.get('/admin/overview', (req, res) => { const u = admin(req, res); if (!u) return; res.json({ users: db.prepare('SELECT COUNT(*) c FROM users').get().c, dashboards: db.prepare('SELECT COUNT(*) c FROM dashboards').get().c, queries: db.prepare('SELECT COUNT(*) c FROM queries').get().c }) })
router.get('/admin/users', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,username,name,email,role FROM users').all()) })
// V3 — saved-query names rendered unsanitised in admin review (stored/blind XSS).
router.get('/admin/queries', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,owner_id,name,description,created FROM queries ORDER BY id DESC').all()) })
router.get('/admin/config', (req, res) => { const u = admin(req, res); if (!u) return; res.json(Object.fromEntries(db.prepare('SELECT key,value FROM config').all().map(r => [r.key, r.value]))) })

router.all('/collect', (req, res) => {
  const data = req.method === 'GET' ? JSON.stringify(req.query) : JSON.stringify(req.body || {})
  if (req.method === 'GET' && Object.keys(req.query).length === 0) return res.json(db.prepare('SELECT id,data,created FROM collect ORDER BY id DESC LIMIT 50').all())
  db.prepare("INSERT INTO collect(data,ip,created) VALUES (?,?,datetime('now'))").run(String(data).slice(0, 3000), req.ip || ''); res.json({ ok: true })
})

module.exports = router
