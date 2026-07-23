// Polyglot routes. Planted: V1 (translation-preview SSTI -> RCE), V2 (project
// IDOR incl. private), V3 (locale export path traversal), V4 (translation value
// stored XSS in admin review), V5 (string-search SQLi), V6 (mass-assign -> admin),
// V7 (JWT forge via leaked secret), V8 (cross-project translate IDOR write), V9
// (suggestion blind XSS), V-csrf/redir.
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
  res.setHeader('Set-Cookie', `pg_sid=${jwt.sign({ id: u.id, sid: true }, SECRET, { expiresIn: '7d' })}; Path=/; SameSite=Lax; Max-Age=604800`)
  res.json({ access: sign(u), user: meCard(u) })
})
router.post('/auth/register', (req, res) => {
  const { username, password, email, name } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'username and password required' })
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) return res.status(409).json({ error: 'username taken' })
  const id = db.prepare('SELECT MAX(id) m FROM users').get().m + 1
  db.prepare("INSERT INTO users(id,uuid,username,email,password,hash_algo,role,name,avatar_seed,created) VALUES (?,?,?,?,?, 'bcrypt','contributor',?,?, datetime('now'))").run(id, 'usr_' + id, username, email || '', bcryptHash(password), name || username, username)
  res.json({ access: sign(user(id)), user: meCard(user(id)) })
})
router.get('/me', (req, res) => { const u = auth(req, res); if (!u) return; res.json(meCard(user(u.id))) })
// V6 — mass assignment: role honored.
router.patch('/me', (req, res) => {
  const u = auth(req, res); if (!u) return
  const A = ['name', 'role']; const sets = [], vals = []
  for (const k of Object.keys(req.body || {})) if (A.includes(k)) { sets.push(`${k}=?`); vals.push(req.body[k]) }
  if (sets.length) { vals.push(u.id); db.prepare(`UPDATE users SET ${sets.join(',')} WHERE id=?`).run(...vals) }
  res.json(meCard(user(u.id)))
})
router.post('/me/email', (req, res) => { const d = sidFromReq(req) ? verify(sidFromReq(req)) : null; if (!d || !d.id) return res.status(401).json({ error: 'no session' }); db.prepare('UPDATE users SET email=? WHERE id=?').run((req.body || {}).email || '', d.id); res.json({ ok: true }) })
router.get('/continue', (req, res) => res.redirect(req.query.next || '/'))  // V-redir

// ---- projects ----------------------------------------------------------------
router.get('/projects', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare("SELECT id,name,slug,visibility,source_lang,description FROM projects WHERE visibility='public' OR owner_id=?").all(u.id)) })
// V2 — IDOR: any project (incl. private/confidential).
router.get('/projects/:id', (req, res) => { const u = auth(req, res); if (!u) return; const p = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id); if (!p) return res.status(404).json({ error: 'not found' }); res.json(p) })
router.get('/projects/:id/strings', (req, res) => {
  const u = auth(req, res); if (!u) return
  const strings = db.prepare('SELECT id,key,source_text FROM strings WHERE project_id=?').all(req.params.id)
  const trans = db.prepare('SELECT string_id,lang,value FROM translations WHERE project_id=?').all(req.params.id)
  res.json({ strings, translations: trans })
})

// V3 — locale export path traversal.
const LOCALES = path.join(__dirname, 'locales')
router.get('/export', (req, res) => {
  const u = auth(req, res); if (!u) return
  const file = req.query.file; if (!file) return res.json({ available: fs.readdirSync(LOCALES) })
  try { res.type('text/plain').send(fs.readFileSync(path.join(LOCALES, file), 'utf8')) } catch (e) { res.status(404).json({ error: 'not found', detail: e.message }) }
})

// V5 — string-search SQLi (declared before any /strings/:id).
router.get('/strings/search', (req, res) => {
  const u = auth(req, res); if (!u) return
  const q = req.query.q != null ? String(req.query.q) : ''
  const sql = `SELECT id, key, source_text FROM strings WHERE key LIKE '%${q}%' OR source_text LIKE '%${q}%'`
  try { res.json(db.prepare(sql).all()) } catch (e) { res.status(400).json({ error: 'search failed', detail: e.message, sql }) }
})

// ---- translations ------------------------------------------------------------
// V8 — cross-project translate IDOR: no project membership/visibility check.
router.post('/translations', (req, res) => {
  const u = auth(req, res); if (!u) return
  const b = req.body || {}
  const s = db.prepare('SELECT * FROM strings WHERE id=?').get(b.string_id)
  if (!s) return res.status(404).json({ error: 'string not found' })
  const id = db.prepare("INSERT INTO translations(string_id,project_id,lang,value,translator_id,created) VALUES (?,?,?,?,?, datetime('now'))").run(s.id, s.project_id, String(b.lang || 'es'), String(b.value || ''), u.id).lastInsertRowid
  res.json({ ok: true, id })
})
// V1 — preview renders the translation value server-side (Nunjucks) -> SSTI RCE.
router.post('/preview', (req, res) => {
  const u = auth(req, res); if (!u) return
  const value = (req.body || {}).value != null ? String(req.body.value) : ''
  const ctx = (req.body || {}).vars || { name: 'User', count: 3, project: 'Website' }
  try { res.json({ ok: true, rendered: render(value, ctx) }) } catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})
// V9 — suggestion body stored raw (blind XSS in admin review).
router.post('/strings/:id/suggest', (req, res) => {
  const u = auth(req, res); if (!u) return
  db.prepare("INSERT INTO suggestions(string_id,author,body,created) VALUES (?,?,?, datetime('now'))").run(req.params.id, user(u.id).name, String((req.body || {}).body || '').slice(0, 1000))
  res.json({ ok: true })
})

// ---- admin -------------------------------------------------------------------
router.get('/admin/overview', (req, res) => { const u = admin(req, res); if (!u) return; res.json({ users: db.prepare('SELECT COUNT(*) c FROM users').get().c, projects: db.prepare('SELECT COUNT(*) c FROM projects').get().c, strings: db.prepare('SELECT COUNT(*) c FROM strings').get().c }) })
router.get('/admin/users', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,username,name,email,role FROM users').all()) })
// V4 — translation values + suggestions rendered unsanitised in admin review.
router.get('/admin/review', (req, res) => { const u = admin(req, res); if (!u) return; res.json({ translations: db.prepare('SELECT id,project_id,lang,value FROM translations ORDER BY id DESC LIMIT 50').all(), suggestions: db.prepare('SELECT id,string_id,author,body FROM suggestions ORDER BY id DESC LIMIT 30').all() }) })
router.get('/admin/config', (req, res) => { const u = admin(req, res); if (!u) return; res.json(Object.fromEntries(db.prepare('SELECT key,value FROM config').all().map(r => [r.key, r.value]))) })
router.post('/admin/email/preview', (req, res) => {
  const u = admin(req, res); if (!u) return
  const tpl = (req.body || {}).template != null ? String(req.body.template) : db.prepare("SELECT value FROM config WHERE key='email_template'").get().value
  try { res.json({ ok: true, rendered: render(tpl, (req.body || {}).sample || { name: 'User', count: 3, project: 'Website' }) }) } catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})
router.all('/collect', (req, res) => {
  const data = req.method === 'GET' ? JSON.stringify(req.query) : JSON.stringify(req.body || {})
  if (req.method === 'GET' && Object.keys(req.query).length === 0) return res.json(db.prepare('SELECT id,data,created FROM collect ORDER BY id DESC LIMIT 50').all())
  db.prepare("INSERT INTO collect(data,ip,created) VALUES (?,?,datetime('now'))").run(String(data).slice(0, 3000), req.ip || ''); res.json({ ok: true })
})

module.exports = router
