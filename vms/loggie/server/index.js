const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { execSync } = require('child_process')
const path = require('path')

const ACCESS_SECRET = 'loggie-access-secret'
const REFRESH_SECRET = 'loggie-refresh-secret'
const ACCESS_TTL = '60s'   // access token lives 1 minute, then must be refreshed
const REFRESH_TTL = '1d'

const USERS = { demo: 'demo' }   // credentials shown on the login page

const signAccess = (u) => jwt.sign({ username: u, typ: 'access' }, ACCESS_SECRET, { expiresIn: ACCESS_TTL })
const signRefresh = (u) => jwt.sign({ username: u, typ: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_TTL })

const app = express()
app.use(cors())
app.use(express.json())

// --- login: requires the captcha checkbox AND valid credentials ---
app.post('/api/login', (req, res) => {
  const { username, password, captcha } = req.body || {}
  if (captcha !== true) return res.status(400).json({ error: 'captcha not completed' })   // must tick the box
  if (!username || USERS[username] !== password) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ access: signAccess(username), refresh: signRefresh(username), user: { username } })
})

// --- refresh: exchange a refresh token for a fresh 1-minute access token ---
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

// VULN[rce]: authenticated "system diagnostics" tool runs a shell command (only reachable after login,
// and only while a fresh access token is held — expires every 60s).
app.post('/api/run', auth, (req, res) => {
  const cmd = (req.body && req.body.cmd) || ''
  try { res.json({ output: execSync(cmd, { timeout: 5000 }).toString() }) }
  catch (e) { res.status(500).json({ error: e.message, output: (e.stdout && e.stdout.toString()) || '' }) }
})

app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

app.listen(80, () => console.log('loggie on :80'))
