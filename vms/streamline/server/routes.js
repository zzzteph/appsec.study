// Streamline REST. Planted: V6 (history IDOR — any room's messages), V7 (message
// search SQLi), V8 (mass-assign -> admin), V9 (admin announcement SSTI -> RCE),
// V10 (export traversal), V-redir.
const express = require('express')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const router = express.Router()
const { db } = require('./db')
const { SECRET, sign, verify, userFromReq } = require('./auth')
const jwt = require('jsonwebtoken')
const { render } = require('./templates')
const md5 = (p) => crypto.createHash('md5').update(p).digest('hex')

function auth(req, res) { const u = userFromReq(req); if (!u) { res.status(401).json({ error: 'login required' }); return null } return u }
function admin(req, res) { const u = auth(req, res); if (!u) return null; if (u.role !== 'admin') { res.status(403).json({ error: 'admin only' }); return null } return u }
const user = (id) => db.prepare('SELECT * FROM users WHERE id=?').get(id)
const pub = (u) => ({ id: u.id, username: u.username, role: u.role })

router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username || '')
  if (!u || !(u.hash_algo === 'md5' ? md5(password || '') === u.password : password === u.password)) return res.status(401).json({ error: 'invalid credentials' })
  const t = sign(u)
  res.setHeader('Set-Cookie', `sl_sess=${t}; Path=/; SameSite=Lax; Max-Age=14400`)   // cookie the browser sends on the WS handshake (V1)
  res.json({ access: t, user: pub(u) })
})
router.get('/me', (req, res) => { const u = auth(req, res); if (!u) return; res.json(pub(user(u.id))) })
router.patch('/me', (req, res) => { const u = auth(req, res); if (!u) return; if ('role' in (req.body || {})) db.prepare('UPDATE users SET role=? WHERE id=?').run(req.body.role, u.id); res.json(pub(user(u.id))) })  // V8 mass-assign

router.get('/rooms', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT id,name,private FROM rooms').all()) })
// V6 — IDOR: any room's message history over REST (incl. private).
router.get('/rooms/:id/messages', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT sender,text,created FROM messages WHERE room_id=? ORDER BY id').all(req.params.id)) })
// V7 — message search SQLi.
router.get('/search', (req, res) => {
  const u = auth(req, res); if (!u) return
  const q = req.query.q != null ? String(req.query.q) : ''
  const sql = `SELECT sender, text FROM messages WHERE text LIKE '%${q}%'`
  try { res.json(db.prepare(sql).all()) } catch (e) { res.status(400).json({ error: 'search failed', detail: e.message, sql }) }
})
// V9 — admin announcement template rendered server-side -> SSTI RCE.
router.post('/admin/announce', (req, res) => {
  const u = admin(req, res); if (!u) return
  try { res.json({ ok: true, rendered: render(String((req.body || {}).template || ''), { app: 'Streamline' }) }) } catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})
router.get('/admin/users', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,username,role FROM users').all()) })
// V10 — export traversal.
const EXP = path.join(__dirname, 'exports')
router.get('/export', (req, res) => {
  const u = auth(req, res); if (!u) return
  const file = req.query.file; if (!file) return res.json({ available: fs.readdirSync(EXP) })
  try { res.type('text/plain').send(fs.readFileSync(path.join(EXP, file), 'utf8')) } catch (e) { res.status(404).json({ error: 'not found', detail: e.message }) }
})
router.get('/continue', (req, res) => res.redirect(req.query.next || '/'))

module.exports = router
