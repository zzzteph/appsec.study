const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { execSync } = require('child_process')
const path = require('path')

const ACCESS_SECRET = 'reggie-access-secret'
const REFRESH_SECRET = 'reggie-refresh-secret'
const ACCESS_TTL = '60s'   // access token lives 1 minute, then must be refreshed
const REFRESH_TTL = '1d'

const USERS = {}   // no seeded accounts — you must register first

const signAccess = (u) => jwt.sign({ username: u, typ: 'access' }, ACCESS_SECRET, { expiresIn: ACCESS_TTL })
const signRefresh = (u) => jwt.sign({ username: u, typ: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_TTL })

const app = express()
app.use(cors())
app.use(express.json())

// --- register: create an account (captcha required). No account is provided — you must make one. ---
app.post('/api/register', (req, res) => {
  const { username, password, captcha } = req.body || {}
  if (captcha !== true) return res.status(400).json({ error: 'captcha not completed' })
  if (!username || !password) return res.status(400).json({ error: 'username and password required' })
  if (USERS[username] !== undefined) return res.status(409).json({ error: 'username already taken' })
  USERS[username] = password
  res.json({ ok: true })
})

// --- login: after registering, sign in (captcha required) ---
app.post('/api/login', (req, res) => {
  const { username, password, captcha } = req.body || {}
  if (captcha !== true) return res.status(400).json({ error: 'captcha not completed' })
  if (!username || USERS[username] !== password) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ access: signAccess(username), refresh: signRefresh(username), user: { username } })
})

app.post('/api/refresh', (req, res) => {
  const { refresh } = req.body || {}
  try { const d = jwt.verify(refresh, REFRESH_SECRET); if (d.typ !== 'refresh') throw 0; res.json({ access: signAccess(d.username) }) }
  catch { res.status(401).json({ error: 'invalid refresh token' }) }
})

function auth(req, res, next) {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/)
  if (!m) return res.status(401).json({ error: 'auth required' })
  try { const d = jwt.verify(m[1], ACCESS_SECRET); if (d.typ !== 'access') throw 0; req.user = d; next() }
  catch { return res.status(401).json({ error: 'access token expired or invalid' }) }
}

app.get('/api/me', auth, (req, res) => res.json({ username: req.user.username }))

// VULN[rce]: authenticated "system diagnostics" tool — reachable only after you register + log in.
app.post('/api/run', auth, (req, res) => {
  const cmd = (req.body && req.body.cmd) || ''
  try { res.json({ output: execSync(cmd, { timeout: 5000 }).toString() }) }
  catch (e) { res.status(500).json({ error: e.message, output: (e.stdout && e.stdout.toString()) || '' }) }
})

app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

app.listen(80, () => console.log('reggie on :80'))
