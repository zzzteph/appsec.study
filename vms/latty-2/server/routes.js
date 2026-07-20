const express = require('express')
const { sign, userFromReq } = require('./auth')

const router = express.Router()

const USERS = [
  { username: 'demo', password: 'demo', role: 'ops' },
  { username: 'sre',  password: 'oncall2024', role: 'ops' },
]

function auth(req, res, next) {
  const u = userFromReq(req)
  if (!u) return res.status(401).json({ error: 'auth required' })
  req.user = u; next()
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = USERS.find(x => x.username === username && x.password === password)
  if (!u) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ token: sign(u), user: { username: u.username, role: u.role } })
})

router.get('/me', auth, (req, res) => res.json(req.user))

// A saved list of endpoints ops likes to health-check (hints at the "webhook tester").
router.get('/checks', auth, (req, res) => res.json([
  { name: 'Public site', url: 'https://example.com/health' },
  { name: 'Payments webhook', url: 'https://example.com/hooks/pay' },
]))

// VULN[ssrf]: the "HTTP request tester" performs a fully attacker-controlled request server-side
// (any URL, method, headers, body) and returns the response verbatim. No allowlist, no scheme/host
// restriction — so it can reach internal-only services like http://127.0.0.1:9000/.
router.post('/fetch', auth, async (req, res) => {
  const { url, method = 'GET', headers = {}, body } = req.body || {}
  if (!url) return res.status(400).json({ error: 'url required' })
  try {
    const r = await fetch(url, {
      method,
      headers: headers && typeof headers === 'object' ? headers : {},
      body: body !== undefined && method !== 'GET' && method !== 'HEAD'
        ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    })
    const text = await r.text()
    const h = {}; r.headers.forEach((v, k) => { h[k] = v })
    res.json({ status: r.status, headers: h, body: text })
  } catch (e) {
    res.status(502).json({ error: e.message })
  }
})

module.exports = router
