const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { execSync } = require('child_process')
const path = require('path')
const cap = require('./captcha')

const ACCESS_SECRET = 'captcha-access-secret'
const REFRESH_SECRET = 'captcha-refresh-secret'
const ACCESS_TTL = '60s'   // 1-minute access token, then refresh
const REFRESH_TTL = '1d'
const USERS = { demo: 'demo' }

const signAccess = (u) => jwt.sign({ username: u, typ: 'access' }, ACCESS_SECRET, { expiresIn: ACCESS_TTL })
const signRefresh = (u) => jwt.sign({ username: u, typ: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_TTL })

const app = express()
app.use(cors())
app.use(express.json())

// ---------- captcha ----------
app.get('/api/captcha', (req, res) => res.json(cap.newSession()))

// checkbox click submits the browser proof-of-work nonce; valid proof → solved (no challenge)
app.post('/api/captcha/verify', (req, res) => {
  const { id, nonce } = req.body || {}
  if (nonce !== undefined && cap.verifyPow(id, nonce)) return res.json({ ok: true, token: cap.markSolved(id) })
  const code = cap.ensureCode(id)
  if (code == null) return res.status(400).json({ error: 'unknown captcha session' })
  res.json({ ok: false, challenge: true })   // no/invalid proof → must solve the image challenge
})

// distorted-text PNG (the code lives only in the pixels)
app.get('/api/captcha/image/:id', (req, res) => {
  const code = cap.ensureCode(req.params.id)
  if (code == null) return res.status(404).json({ error: 'unknown captcha session' })
  res.type('png').send(cap.renderCaptcha(code))
})

app.post('/api/captcha/solve', (req, res) => {
  const { id, answer } = req.body || {}
  const r = cap.solveImage(id, answer)
  if (r === null) return res.status(400).json({ error: 'no challenge for this session' })
  if (r === false) return res.status(400).json({ ok: false, error: 'incorrect code' })
  res.json({ ok: true, token: r })
})

// test-only: reveal the code so the automated harness can verify the image path (off by default)
app.get('/api/captcha/peek/:id', (req, res) => {
  if (!process.env.CAPTCHA_TEST) return res.status(404).json({ error: 'not found' })
  res.json({ code: cap.peekCode(req.params.id) || null })
})

// ---------- auth ----------
app.post('/api/login', (req, res) => {
  const { username, password, captchaToken } = req.body || {}
  if (!captchaToken || !cap.consumeToken(captchaToken)) return res.status(400).json({ error: 'captcha not solved' })
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

// VULN[rce]: reachable only after login (which requires a solved captcha + demo/demo)
app.post('/api/run', auth, (req, res) => {
  const cmd = (req.body && req.body.cmd) || ''
  try { res.json({ output: execSync(cmd, { timeout: 5000 }).toString() }) }
  catch (e) { res.status(500).json({ error: e.message, output: (e.stdout && e.stdout.toString()) || '' }) }
})

app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

app.listen(80, () => console.log('captcha on :80'))
