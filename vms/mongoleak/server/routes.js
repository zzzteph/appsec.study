// MongoLeak routes. Planted: V1 (login operator-injection auth bypass — password
// {"$gt":""}/{"$ne":null}), V2 ($where JS injection -> RCE), V3 (blind NoSQLi via
// $regex — extract admin password), V4 (note IDOR), V5 (mass-assign -> admin),
// V6 (user IDOR), V-redir. The queries below pass the request JSON straight into
// Mongo-style find/findOne — exactly the real-world NoSQLi pattern.
const express = require('express')
const router = express.Router()
const { users, notes } = require('./db')
const { sign, userFromReq } = require('./auth')

function auth(req, res) { const u = userFromReq(req); if (!u) { res.status(401).json({ error: 'login required' }); return null } return u }
function admin(req, res) { const u = auth(req, res); if (!u) return null; if (u.role !== 'admin') { res.status(403).json({ error: 'admin only' }); return null } return u }
const pub = (u) => ({ id: u._id, username: u.username, role: u.role, email: u.email })

// V1/V3 — login builds a Mongo query directly from the request body. A password
// object like {"$gt":""} or {"$ne":null} matches any password (auth bypass); a
// {"$regex":"^X"} password turns it into a boolean oracle (blind extraction).
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  if (username === undefined || password === undefined) return res.status(400).json({ error: 'username and password required' })
  const u = users.findOne({ username, password })
  if (!u) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ access: sign(u), user: pub(u) })
})
router.post('/auth/register', (req, res) => {
  const { username, password, email, role } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'username and password required' })
  if (users.findOne({ username })) return res.status(409).json({ error: 'username taken' })
  const u = users.insert({ username: String(username), password: String(password), role: role || 'user', email: email || '' })  // V5 — role from body (mass assignment)
  res.json({ access: sign(u), user: pub(u) })
})
router.get('/me', (req, res) => { const u = auth(req, res); if (!u) return; const d = users.byId(u.id); res.json(pub(d)) })
// V5 — profile update honors role.
router.patch('/me', (req, res) => {
  const u = auth(req, res); if (!u) return
  const d = users.byId(u.id)
  for (const k of ['email', 'role']) if (k in (req.body || {})) d[k] = req.body[k]
  res.json(pub(d))
})

// ---- notes -------------------------------------------------------------------
router.get('/notes', (req, res) => { const u = auth(req, res); if (!u) return; res.json(notes.find({ owner: u.username })) })
router.post('/notes', (req, res) => { const u = auth(req, res); if (!u) return; const n = notes.insert({ owner: u.username, title: String((req.body || {}).title || ''), body: String((req.body || {}).body || ''), private: !!(req.body || {}).private }); res.json({ ok: true, id: n._id }) })
// V4 — IDOR: any note by id.
router.get('/notes/:id', (req, res) => { const u = auth(req, res); if (!u) return; const n = notes.byId(req.params.id); if (!n) return res.status(404).json({ error: 'not found' }); res.json(n) })

// V2 (via $where) + operator-injection — search passes the raw `filter` object
// straight into find(). filter={"owner":{"$ne":"x"}} returns everyone's notes;
// filter={"$where":"..."} runs server-side JS.
router.post('/notes/search', (req, res) => {
  const u = auth(req, res); if (!u) return
  const filter = (req.body || {}).filter
  if (filter === undefined || typeof filter !== 'object') return res.status(400).json({ error: 'filter object required' })
  try { res.json({ results: notes.find(filter) }) } catch (e) { res.status(400).json({ error: 'query error', detail: e.message }) }
})
// V2 — "$where / $function" expression evaluated server-side -> RCE (output returned).
router.post('/notes/where', (req, res) => {
  const u = auth(req, res); if (!u) return
  const where = String((req.body || {}).where || 'true')
  try { const result = new Function('return (' + where + ')')(); res.json({ ok: true, result: String(result) }) }
  catch (e) { res.status(400).json({ error: 'where error', detail: e.message }) }
})

// ---- users / admin -----------------------------------------------------------
// V6 — IDOR: any user (incl. email/role).
router.get('/users/:id', (req, res) => { const u = auth(req, res); if (!u) return; const d = users.byId(req.params.id); if (!d) return res.status(404).json({ error: 'not found' }); res.json(pub(d)) })
router.get('/admin/users', (req, res) => { const u = admin(req, res); if (!u) return; res.json(users.all().map(pub)) })
router.get('/admin/notes', (req, res) => { const u = admin(req, res); if (!u) return; res.json(notes.all()) })
router.get('/continue', (req, res) => res.redirect(req.query.next || '/'))  // V-redir

module.exports = router
