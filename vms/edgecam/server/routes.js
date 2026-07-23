// EdgeCam routes. Planted: V1 (default creds admin/admin), V2 (diagnostics
// command injection -> RCE), V3 (firmware upload+apply -> RCE), V4 (header-based
// auth bypass — trusted-local), V5 (unauthenticated /system/info leaks creds +
// cloud key), V6 (state-changing GET -> CSRF), V7 (log download traversal), V8
// (recording IDOR), V-redir. V-bundle: cloud key hint also in the SPA bundle.
const express = require('express')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const router = express.Router()
const { db } = require('./db')
const { sign, userFromReq, isTrustedLocal } = require('./auth')

function auth(req, res) { const u = userFromReq(req); if (!u) { res.status(401).json({ error: 'login required' }); return null } return u }
// V4 — admin access via valid session OR a trusted-local forwarded header.
function admin(req, res) {
  const u = userFromReq(req)
  if (u && u.role === 'admin') return u
  if (isTrustedLocal(req)) return { username: 'local', role: 'admin', local: true }
  res.status(403).json({ error: 'admin access required' }); return null
}

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username || '', password || '')
  if (!u) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ access: sign(u), user: { username: u.username, role: u.role } })
})
router.get('/me', (req, res) => { const u = auth(req, res); if (!u) return; res.json({ username: u.username, role: u.role }) })

// V5 — device info exposed WITHOUT authentication; leaks admin password + cloud key.
router.get('/system/info', (req, res) => {
  res.json({
    device: db.prepare("SELECT value FROM settings WHERE key='device_name'").get().value,
    firmware: db.prepare("SELECT value FROM settings WHERE key='firmware'").get().value,
    ip: db.prepare("SELECT value FROM settings WHERE key='ip'").get().value,
    settings: Object.fromEntries(db.prepare('SELECT key,value FROM settings').all().map(r => [r.key, r.value])),
  })
})

// ---- cameras & recordings ----------------------------------------------------
router.get('/cameras', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT id,name,channel,status,rtsp FROM cameras').all()) })
router.get('/recordings', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT id,camera_id,started,duration,size_mb FROM recordings ORDER BY id DESC').all()) })
// V8 — IDOR: any recording by id (path disclosed).
router.get('/recordings/:id', (req, res) => { const u = auth(req, res); if (!u) return; const r = db.prepare('SELECT * FROM recordings WHERE id=?').get(req.params.id); if (!r) return res.status(404).json({ error: 'not found' }); res.json(r) })

// ---- diagnostics (V2 command injection -> RCE) -------------------------------
router.post('/diagnostics/ping', (req, res) => {
  const u = admin(req, res); if (!u) return
  const host = String((req.body || {}).host || '127.0.0.1')
  let out; try { out = execSync('ping -c 1 ' + host + ' 2>&1', { encoding: 'utf8', timeout: 10000 }) } catch (e) { out = (e.stdout || '') + (e.stderr || '') }
  res.json({ ok: true, output: String(out) })
})
router.post('/diagnostics/traceroute', (req, res) => {
  const u = admin(req, res); if (!u) return
  const host = String((req.body || {}).host || '127.0.0.1')
  let out; try { out = execSync('echo tracing route to ' + host + ' 2>&1', { encoding: 'utf8' }) } catch (e) { out = (e.stdout || '') + (e.stderr || '') }
  res.json({ ok: true, output: String(out) })
})

// ---- firmware (V3 upload + apply -> RCE) -------------------------------------
const FWDIR = path.join(__dirname, 'firmware')
try { fs.mkdirSync(FWDIR, { recursive: true }) } catch {}
router.post('/firmware/upload', (req, res) => {
  const u = admin(req, res); if (!u) return
  const name = String((req.body || {}).name || 'update.sh').replace(/[^\w.\-]/g, '_')
  try { fs.writeFileSync(path.join(FWDIR, name), String((req.body || {}).content || '')) } catch (e) { return res.status(500).json({ error: e.message }) }
  res.json({ ok: true, name })
})
router.post('/firmware/apply', (req, res) => {
  const u = admin(req, res); if (!u) return
  const name = String((req.body || {}).name || 'update.sh').replace(/[^\w.\-]/g, '_')
  let out; try { out = execSync('sh ' + path.join(FWDIR, name) + ' 2>&1', { encoding: 'utf8', timeout: 10000 }) } catch (e) { out = (e.stdout || '') + (e.stderr || '') }
  res.json({ ok: true, message: 'firmware applied', output: String(out) })
})

// ---- settings & actions ------------------------------------------------------
router.get('/settings', (req, res) => { const u = admin(req, res); if (!u) return; res.json(Object.fromEntries(db.prepare('SELECT key,value FROM settings').all().map(r => [r.key, r.value]))) })
// V6 — state-changing GET (no CSRF token) — classic embedded pattern.
router.get('/settings/set', (req, res) => {
  const u = admin(req, res); if (!u) return
  const { key, value } = req.query
  if (key) db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(String(key), String(value || ''))
  res.json({ ok: true })
})
router.get('/action/reboot', (req, res) => { const u = admin(req, res); if (!u) return; res.json({ ok: true, message: 'rebooting' }) })

// ---- logs (V7 traversal) -----------------------------------------------------
const LOGS = path.join(__dirname, 'logs')
router.get('/logs/download', (req, res) => {
  const u = admin(req, res); if (!u) return
  const file = req.query.file; if (!file) return res.json({ available: fs.readdirSync(LOGS) })
  try { res.type('text/plain').send(fs.readFileSync(path.join(LOGS, file), 'utf8')) } catch (e) { res.status(404).json({ error: 'not found', detail: e.message }) }
})

router.get('/users', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,username,role FROM users WHERE hidden=0').all()) })
router.get('/continue', (req, res) => res.redirect(req.query.next || '/'))  // V-redir

module.exports = router
