const express = require('express')
const fs = require('fs')
const path = require('path')
const { sign, userFromReq } = require('./auth')

const router = express.Router()
const DOCS_DIR = path.join(__dirname, 'docs')
const EXT_DIR = path.join(__dirname, 'extensions')

const USERS = [{ username: 'demo', password: 'demo', role: 'user' }]

function auth(req, res, next) {
  const u = userFromReq(req)
  if (!u) return res.status(401).json({ error: 'auth required' })
  req.user = u; next()
}
function adminAuth(req, res, next) {
  const u = userFromReq(req)
  if (!u) return res.status(401).json({ error: 'auth required' })
  if (u.role !== 'admin') return res.status(403).json({ error: 'admin only' })
  req.user = u; next()
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = USERS.find(x => x.username === username && x.password === password)
  if (!u) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ token: sign(u), user: { username: u.username, role: u.role } })
})
router.get('/me', auth, (req, res) => res.json(req.user))

// VULN[lfi]: the doc viewer joins a user-supplied name onto the docs dir with no sanitization, so
// `file=../secret/jwt.secret` (or ../../etc/passwd) escapes and reads arbitrary files — including the
// JWT signing secret.
router.get('/docs', (req, res) => {
  const file = req.query.file || 'intro.md'
  try {
    const data = fs.readFileSync(path.join(DOCS_DIR, file), 'utf8')
    res.type('text/plain').send(data)
  } catch (e) {
    res.status(404).json({ error: 'not found: ' + file })
  }
})

// ---------- admin extension console (reachable only with a forged admin token) ----------

// VULN[upload]: unrestricted — any filename, any content (incl. .js), no validation.
router.post('/admin/extensions', adminAuth, (req, res) => {
  const { filename, content } = req.body || {}
  if (!filename) return res.status(400).json({ error: 'filename required' })
  fs.mkdirSync(EXT_DIR, { recursive: true })
  fs.writeFileSync(path.join(EXT_DIR, filename), content == null ? '' : String(content))
  res.json({ ok: true, saved: filename })
})

router.get('/admin/extensions', adminAuth, (req, res) => {
  let list = []
  try { list = fs.readdirSync(EXT_DIR) } catch {}
  res.json(list)
})

// VULN[rce]: loads and executes an uploaded module — the uploaded .js is a webshell.
router.post('/admin/extensions/:name/run', adminAuth, (req, res) => {
  const full = path.join(EXT_DIR, req.params.name)
  try {
    const resolved = require.resolve(full)
    delete require.cache[resolved]
    const mod = require(resolved)
    const fn = typeof mod === 'function' ? mod : (mod && typeof mod.run === 'function' ? mod.run : null)
    const out = fn ? fn(req.body && req.body.args) : mod
    res.json({ output: typeof out === 'string' ? out : JSON.stringify(out) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
