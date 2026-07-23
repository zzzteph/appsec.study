// Trackr routes. The injections here are deliberately NOT reflected — errors are
// swallowed, no data comes back directly. Planted:
//  V1 boolean-blind SQLi  — GET /track?code=   (returns only {found:true|false})
//  V2 time-based blind SQLi — GET /subscribe/status?ref=  (returns nothing; timing only)
//  V3 second-order SQLi   — GET /account/activity  (raw query over the STORED username)
//  V4 blind command injection — POST /admin/diag  (no output; result readable via /admin/diag/log)
//  V5 second-order stored XSS — feedback body rendered in /admin/feedback
//  V6 IDOR — GET /addresses/:id
const express = require('express')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const router = express.Router()
const { db } = require('./db')
const { sign, userFromReq } = require('./auth')

function auth(req, res) { const u = userFromReq(req); if (!u) { res.status(401).json({ error: 'unauthorized' }); return null } return u }
function admin(req, res) { const u = auth(req, res); if (!u) return null; if (u.role !== 'admin') { res.status(403).json({ error: 'admin only' }); return null } return u }

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username || '', password || '')  // parameterized (safe)
  if (!u) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ access: sign(u), user: { id: u.id, username: u.username, role: u.role, email: u.email } })
})
router.post('/auth/register', (req, res) => {
  const { username, password, email } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'username and password required' })
  if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) return res.status(409).json({ error: 'username taken' })
  const id = db.prepare('SELECT MAX(id) m FROM users').get().m + 1
  db.prepare("INSERT INTO users(id,username,password,role,email,created) VALUES (?,?,?, 'user', ?, datetime('now'))").run(id, username, password, email || '')  // parameterized INSERT — safe at input, but the username is used raw later (V3)
  db.prepare("INSERT INTO activity(username,event,created) VALUES (?, 'Signed up', datetime('now'))").run(username)
  res.json({ access: sign({ id, username, role: 'user' }), user: { id, username, role: 'user' } })
})

// V1 — boolean-blind SQLi. Only a true/false comes back.
router.get('/track', (req, res) => {
  const code = req.query.code != null ? String(req.query.code) : ''
  try {
    const c = db.prepare(`SELECT COUNT(*) c FROM packages WHERE tracking = '${code}'`).get().c
    res.json({ found: c > 0 })
  } catch { res.json({ found: false }) }   // errors swallowed — no error-based leak
})
// Legit details lookup (parameterized, safe).
router.get('/track/details', (req, res) => {
  const p = db.prepare('SELECT tracking,status,carrier,eta,dest FROM packages WHERE tracking = ?').get(String(req.query.code || ''))
  res.json(p || { error: 'not found' })
})

// V2 — time-based blind SQLi. Response is constant; only timing varies.
router.get('/subscribe/status', (req, res) => {
  const ref = req.query.ref != null ? String(req.query.ref) : ''
  try { db.prepare(`SELECT COUNT(*) c FROM packages WHERE tracking = '${ref}'`).get() } catch {}
  res.json({ ok: true, message: 'subscription status checked' })
})

// V3 — second-order SQLi: the caller's STORED username is concatenated into a query.
router.get('/account/activity', (req, res) => {
  const u = auth(req, res); if (!u) return
  try {
    const rows = db.prepare(`SELECT event, created FROM activity WHERE username = '${u.username}'`).all()
    res.json(rows)
  } catch (e) { res.json([]) }
})

// V6 — IDOR: any address by id.
router.get('/addresses/:id', (req, res) => {
  const u = auth(req, res); if (!u) return
  const a = db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id)
  if (!a) return res.status(404).json({ error: 'not found' })
  res.json(a)
})
router.get('/addresses', (req, res) => {
  const u = auth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,label,line1,city,zip FROM addresses WHERE user_id = ?').all(u.id))
})

// V5 — feedback stored raw; rendered unsanitised in admin review (second-order XSS).
router.post('/feedback', (req, res) => {
  const u = auth(req, res); if (!u) return
  db.prepare("INSERT INTO feedback(username,subject,body,created) VALUES (?,?,?, datetime('now'))").run(u.username, String((req.body || {}).subject || '').slice(0, 120), String((req.body || {}).body || '').slice(0, 2000))
  res.json({ ok: true })
})

// ---- admin -------------------------------------------------------------------
router.get('/admin/feedback', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,username,subject,body,created FROM feedback ORDER BY id DESC').all()) })
router.get('/admin/users', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,username,role,email FROM users').all()) })

// V4 — blind command injection. The diagnostics runner shells out; nothing is
// returned in the response (blind), but the raw output is written to a log the
// admin can read separately.
const LOGF = path.join(__dirname, 'diag.log')
router.post('/admin/diag', (req, res) => {
  const u = admin(req, res); if (!u) return
  const host = String((req.body || {}).host || 'localhost')
  let out; try { out = execSync('ping -c 1 ' + host + ' 2>&1', { encoding: 'utf8', timeout: 10000 }) } catch (e) { out = (e.stdout || '') + (e.stderr || '') }
  try { fs.writeFileSync(LOGF, out) } catch {}
  res.json({ ok: true, message: 'diagnostics complete' })   // no output returned
})
router.get('/admin/diag/log', (req, res) => {
  const u = admin(req, res); if (!u) return
  let log = ''; try { log = fs.readFileSync(LOGF, 'utf8') } catch {}
  res.type('text/plain').send(log)
})

module.exports = router
