// Identity-provider native endpoints. Planted: V7 (register allows a duplicate
// email -> RP identifies by email -> ATO), V13 (user-search SQLi), V8 (IDOR on
// /users/:id and /users/:id/apps), V12 (client name stored raw -> XSS), V10
// (open redirect), V14 (debug config disclosure incl signing key), V6 impact
// (admin-scope-gated directory).
const express = require('express')
const router = express.Router()
const { db, actor, requireUser, hasScope, user, userByName, pubUser } = require('./_util')
const { signSession, bcryptHash, bcryptCheck, md5 } = require('../auth')

function setSession(res, u) {
  res.setHeader('Set-Cookie', `mid_sess=${signSession(u)}; Path=/; SameSite=Lax; Max-Age=604800`)
}
const checkPw = (u, p) => u.hash_algo === 'md5' ? md5(p) === u.password : bcryptCheck(p, u.password)
const meCard = (u) => ({ id: u.id, uuid: u.uuid, username: u.username, email: u.email, name: u.name, role: u.role, department: u.department, email_verified: !!u.email_verified, mfa_enabled: !!u.mfa_enabled, avatar_seed: u.avatar_seed })

router.post('/idp/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = userByName(username || '')
  if (!u || !checkPw(u, password || '')) return res.status(401).json({ error: 'invalid credentials' })
  setSession(res, u)
  res.json({ ok: true, user: meCard(u) })
})

// V7 — email is NOT unique on registration; downstream RPs identify the user by
// email claim, so registering with a victim's email yields their RP account.
router.post('/idp/register', (req, res) => {
  const { username, email, password } = req.body || {}
  if (!username || !email || !password) return res.status(400).json({ error: 'username, email, password required' })
  if (userByName(username)) return res.status(409).json({ error: 'username taken' })
  const id = (db.prepare('SELECT MAX(id) m FROM users').get().m || 0) + 1
  db.prepare(`INSERT INTO users(id,uuid,username,email,password,hash_algo,role,name,avatar_seed,email_verified,mfa_enabled,department,created)
    VALUES (?,?,?,?,?, 'bcrypt','user',?,?,0,0,'Guest',datetime('now'))`)
    .run(id, 'usr_' + id, username, email, bcryptHash(password), username, username)
  setSession(res, user(id))
  res.json({ ok: true, user: meCard(user(id)) })
})

router.post('/idp/logout', (req, res) => { res.setHeader('Set-Cookie', 'mid_sess=; Path=/; Max-Age=0'); res.json({ ok: true }) })
router.get('/idp/me', (req, res) => { const a = requireUser(req, res); if (!a) return; res.json(meCard(user(a.sub))) })

// V13 — user search SQLi (any logged-in user). Dump users (admin md5) or config
// (jwt_signing_key) via UNION.
router.get('/idp/users/search', (req, res) => {
  const a = requireUser(req, res); if (!a) return
  const q = req.query.q != null ? String(req.query.q) : ''
  const sql = `SELECT id, username, name, email, department FROM users WHERE name LIKE '%${q}%' OR email LIKE '%${q}%'`
  try { res.json(db.prepare(sql).all()) }
  catch (e) { res.status(400).json({ error: 'search failed', detail: e.message, sql }) }
})

// V8 — IDOR: any user's profile + their authorized apps, no ownership check.
router.get('/idp/users/:id', (req, res) => {
  const a = requireUser(req, res); if (!a) return
  const u = user(req.params.id); if (!u) return res.status(404).json({ error: 'not found' })
  res.json(meCard(u))
})
router.get('/idp/users/:id/apps', (req, res) => {
  const a = requireUser(req, res); if (!a) return
  res.json(db.prepare('SELECT client_id, scope, created FROM consents WHERE user_id = ?').all(req.params.id))
})

// App directory / client registration. V12 — client name stored raw and later
// rendered unsanitised on the consent screen + admin apps list.
router.get('/idp/clients', (req, res) => {
  res.json(db.prepare('SELECT client_id, name, logo FROM clients ORDER BY created').all())
})
router.post('/idp/clients', (req, res) => {
  const a = requireUser(req, res); if (!a) return
  const { name, redirect_uri, scopes } = req.body || {}
  const cid = 'app-' + Math.random().toString(36).slice(2, 8)
  db.prepare(`INSERT INTO clients(client_id,client_secret,name,redirect_uris,allowed_scopes,owner_id,logo,created)
    VALUES (?,?,?,?,?,?, 'app', datetime('now'))`).run(cid, 'sec_' + cid, String(name || 'New App'), String(redirect_uri || '/apps/docs/callback'), String(scopes || 'openid profile email'), Number(a.sub))
  res.json({ ok: true, client_id: cid, client_secret: 'sec_' + cid })
})

// V6 impact — directory of all users' PII, gated only on the (escalatable) admin scope.
router.get('/idp/directory', (req, res) => {
  const a = requireUser(req, res); if (!a) return
  if (!hasScope(a, 'admin')) return res.status(403).json({ error: 'admin scope required' })
  res.json(db.prepare('SELECT id, username, name, email, department, role FROM users').all())
})

// V10 — open redirect.
router.get('/idp/continue', (req, res) => res.redirect(req.query.return_to || '/'))

// V14 — debug endpoint discloses full config (incl jwt_signing_key).
router.get('/idp/debug', (req, res) => {
  const dbg = db.prepare("SELECT value FROM config WHERE key='debug'").get().value
  if (req.query.show !== 'all' && dbg !== 'true') return res.json({ status: 'ok', hint: 'append ?show=all for diagnostics' })
  res.json({ config: Object.fromEntries(db.prepare('SELECT key,value FROM config').all().map(r => [r.key, r.value])), node: process.version })
})

router.get('/idp/sessions', (req, res) => {
  const a = requireUser(req, res); if (!a) return
  res.json([{ device: 'Chrome on Windows', ip: '10.0.0.5', current: true, created: '2024-05-01T09:00:00Z' }])
})

module.exports = router
