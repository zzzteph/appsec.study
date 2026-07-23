// The Range — one endpoint per class. Each returns its FLAG only when the planted
// vulnerability is actually exploited (correct behaviour reveals nothing).
const express = require('express')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const router = express.Router()
const { db, documents } = require('./db')
const { FLAGS } = require('./flags')
const { expand } = require('./xxe')
const { render } = require('./templates')

const FLAGDIR = path.join(__dirname, 'flags')
const PUBDIR = path.join(__dirname, 'public_docs')

// C1 — classic UNION SQLi.
router.get('/c/1', (req, res) => {
  const q = req.query.q != null ? String(req.query.q) : ''
  const sql = `SELECT id, title, body FROM articles WHERE title LIKE '%${q}%'`
  try { res.json({ results: db.prepare(sql).all() }) } catch (e) { res.status(400).json({ error: 'query failed', detail: e.message, sql }) }
})
// C2 — boolean-blind SQLi (only true/false).
router.get('/c/2', (req, res) => {
  const t = req.query.token != null ? String(req.query.token) : ''
  try { res.json({ valid: db.prepare(`SELECT COUNT(*) c FROM tokens WHERE value = '${t}'`).get().c > 0 }) } catch { res.json({ valid: false }) }
})
// C3 — IDOR.
router.get('/c/3', (req, res) => {
  const d = documents[req.query.doc]
  if (d === undefined) return res.status(404).json({ error: 'not found' })
  res.json({ doc: req.query.doc, content: d })
})
// C4 — path traversal.
router.get('/c/4', (req, res) => {
  const file = req.query.file; if (!file) return res.json({ available: fs.readdirSync(PUBDIR) })
  try { res.type('text/plain').send(fs.readFileSync(path.join(PUBDIR, file), 'utf8')) } catch (e) { res.status(404).json({ error: 'not found', detail: e.message }) }
})
// C5 — SSTI.
router.post('/c/5', (req, res) => {
  const tpl = String((req.body || {}).tpl || 'Hello')
  try { res.json({ rendered: render(tpl, { flag: FLAGS[5].flag, user: 'guest' }) }) } catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})
// C6 — command injection.
router.post('/c/6', (req, res) => {
  const host = String((req.body || {}).host || '127.0.0.1')
  let out; try { out = execSync('ping -c 1 ' + host + ' 2>&1', { encoding: 'utf8', timeout: 10000 }) } catch (e) { out = (e.stdout || '') + (e.stderr || '') }
  res.json({ output: String(out) })
})
// C7 — XXE.
router.post('/c/7', (req, res) => {
  const xml = typeof req.body === 'string' ? req.body : (req.body || {}).xml
  if (!xml) return res.status(400).json({ error: 'xml required' })
  try { res.json({ parsed: expand(String(xml)) }) } catch (e) { res.status(400).json({ error: 'parse error' }) }
})
// C8 — JWT alg:none auth bypass.
router.get('/c/8', (req, res) => {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/)
  if (!m) return res.status(401).json({ error: 'token required (need admin:true)' })
  try {
    const [h, p] = m[1].split('.')
    const hdr = JSON.parse(Buffer.from(h, 'base64').toString('utf8'))
    const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf8'))
    if (hdr.alg === 'none' && payload.admin === true) return res.json({ flag: FLAGS[8].flag })   // accepts unsigned tokens
    res.status(403).json({ error: 'not admin' })
  } catch { res.status(400).json({ error: 'bad token' }) }
})
// C9 — open redirect.
router.get('/c/9', (req, res) => {
  const url = String(req.query.url || '')
  if (/^https?:\/\//i.test(url)) return res.status(302).set('Location', url).json({ flag: FLAGS[9].flag, redirecting_to: url })
  res.json({ message: 'provide ?url= to be redirected' })
})
// C10 — reflected XSS (input reflected into HTML unescaped).
router.get('/c/10', (req, res) => {
  const q = String(req.query.q || '')
  const executable = /<\s*[a-z]|on\w+\s*=/i.test(q)   // a payload that would execute if reflected raw
  res.type('text/html').send(`<!doctype html><body><h3>Results for: ${q}</h3>${executable ? `<!-- ${FLAGS[10].flag} -->` : ''}</body>`)
})
// C11 — mass assignment.
router.patch('/c/11', (req, res) => {
  const role = (req.body || {}).role
  if (role === 'admin') return res.json({ ok: true, role, flag: FLAGS[11].flag })
  res.json({ ok: true, role: role || 'user' })
})
// C12 — NoSQL operator injection.
router.post('/c/12', (req, res) => {
  const p = (req.body || {}).password
  const injected = p !== null && typeof p === 'object' && Object.keys(p).some(k => k.startsWith('$'))
  if (injected) return res.json({ authenticated: true, flag: FLAGS[12].flag })
  res.status(401).json({ authenticated: false })
})
// C13 — trusted-header auth bypass.
router.get('/c/13', (req, res) => {
  const xff = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')
  if (/(^|,\s*)127\.0\.0\.1/.test(xff)) return res.json({ flag: FLAGS[13].flag })
  res.status(403).json({ error: 'admin panel — local requests only' })
})
// C14 — info disclosure (debug endpoint).
router.get('/c/14/debug', (req, res) => res.json({ status: 'ok', node: process.version, config: { env: 'production', internal_flag: FLAGS[14].flag } }))

module.exports = { router, FLAGDIR }
