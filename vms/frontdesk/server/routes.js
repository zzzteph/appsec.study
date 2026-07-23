// FrontDesk backend API. Most of this is an ordinary hotel-booking app. Planted:
//  V-idor    GET /api/reservations/:id  — no ownership check (other guests' PII)
//  V5        POST /api/forgot           — reset link built from Host/X-Forwarded-Host (host-header injection)
//  V6        GET /api/config            — asset/support host reflected from X-Forwarded-Host (cache-poisoning payload)
//  V7        GET /api/account*          — authed PII page reachable at any suffix (cache-deception target)
//  V-intern  admin guard also trusts X-Forwarded-For=127.0.0.1 (internal-network trust)
//  V-rce     POST /api/admin/announce   — Nunjucks SSTI -> RCE
// The X-Original-URL routing override (V3) lives in backend.js.
const express = require('express')
const router = express.Router()
const { db, md5 } = require('./db')
const { sign, bearer, cookieToken, isInternal } = require('./auth')
const { render } = require('./templates')

const userById = (id) => db.prepare('SELECT * FROM users WHERE id=?').get(id)
const pub = (u) => u && ({ id: u.id, username: u.username, role: u.role, name: u.name, email: u.email, phone: u.phone, tier: u.tier })
function current(req) { return bearer(req) || cookieToken(req) }
function auth(req, res) { const c = current(req); if (!c) { res.status(401).json({ error: 'login required' }); return null } return userById(c.id) }

// host the client should use for links/assets — reflected from the forwarding
// headers so it works behind the edge (planted V6 unkeyed input).
function forwardedHost(req) { return req.headers['x-forwarded-host'] || req.headers.host || 'frontdesk.test' }
function forwardedProto(req) { return req.headers['x-forwarded-proto'] || 'https' }

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username || '')
  if (!u || !(u.hash_algo === 'md5' ? md5(password || '') === u.password : password === u.password)) return res.status(401).json({ error: 'invalid credentials' })
  const t = sign(u)
  res.setHeader('Set-Cookie', `fd_sess=${t}; Path=/; SameSite=Lax; Max-Age=21600`)
  res.json({ token: t, user: pub(u) })
})
router.get('/me', (req, res) => { const u = auth(req, res); if (!u) return; res.json(pub(u)) })

// ---- public catalogue (safe) ----
router.get('/rooms', (req, res) => res.json(db.prepare('SELECT id,code,name,kind,sleeps,price,blurb FROM rooms').all()))
router.get('/rooms/:id', (req, res) => { const r = db.prepare('SELECT * FROM rooms WHERE id=?').get(req.params.id); if (!r) return res.status(404).json({ error: 'no such room' }); res.json(r) })
router.get('/rooms/:id/reviews', (req, res) => res.json(db.prepare('SELECT author,stars,body,created FROM reviews WHERE room_id=? ORDER BY id DESC').all(req.params.id)))
router.post('/rooms/:id/reviews', (req, res) => {
  const u = auth(req, res); if (!u) return
  const { stars, body } = req.body || {}
  const s = Math.max(1, Math.min(5, parseInt(stars, 10) || 5))
  db.prepare("INSERT INTO reviews(room_id,author,stars,body,created) VALUES (?,?,?,?, date('now'))").run(req.params.id, u.name, s, String(body || '').slice(0, 500))
  res.json({ ok: true })
})
// availability search (parameterised — safe)
router.get('/search', (req, res) => {
  const sleeps = parseInt(req.query.guests, 10) || 1
  const max = parseInt(req.query.max, 10) || 100000
  res.json(db.prepare('SELECT id,code,name,kind,sleeps,price,blurb FROM rooms WHERE sleeps>=? AND price<=? ORDER BY price').all(sleeps, max))
})

// ---- reservations ----
router.get('/reservations', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT * FROM reservations WHERE user_id=? ORDER BY checkin').all(u.id)) })
// V-idor: any reservation by id, no ownership check -> other guests' card_last4 + stay
router.get('/reservations/:id', (req, res) => {
  const u = auth(req, res); if (!u) return
  const r = db.prepare('SELECT * FROM reservations WHERE id=?').get(req.params.id)
  if (!r) return res.status(404).json({ error: 'not found' })
  res.json(r)
})
router.post('/reservations', (req, res) => {
  const u = auth(req, res); if (!u) return
  const { room_id, checkin, checkout, guests } = req.body || {}
  const room = db.prepare('SELECT * FROM rooms WHERE id=?').get(room_id)
  if (!room) return res.status(400).json({ error: 'no such room' })
  const nights = Math.max(1, Math.round((Date.parse(checkout) - Date.parse(checkin)) / 86400000) || 1)
  const info = db.prepare("INSERT INTO reservations(user_id,room_id,checkin,checkout,guests,status,card_last4,total) VALUES (?,?,?,?,?,?,?,?)")
    .run(u.id, room.id, checkin || '2024-12-01', checkout || '2024-12-02', parseInt(guests, 10) || 1, 'confirmed', '0000', room.price * nights)
  res.json({ ok: true, id: info.lastInsertRowid })
})

// V7 cache-deception target: authed PII, reachable at /account and /account/<anything>
router.get(/^\/account(\/.*)?$/, (req, res) => {
  const u = auth(req, res); if (!u) return
  const resv = db.prepare('SELECT id,room_id,checkin,checkout,status,card_last4,total FROM reservations WHERE user_id=?').all(u.id)
  res.json({ profile: pub(u), reservations: resv })
})

// V5 host-header reset poisoning (link host taken from the request headers)
router.post('/forgot', (req, res) => {
  const { username } = req.body || {}
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username || '')
  if (u) {
    const token = md5(u.username + ':' + u.id + ':reset')
    const link = `${forwardedProto(req)}://${forwardedHost(req)}/reset?token=${token}`
    db.prepare("INSERT INTO inbox(user_id,subject,body,created) VALUES (?,?,?, datetime('now'))").run(u.id, 'Reset your password', `Click to reset your password: ${link}`)
  }
  res.json({ ok: true, message: 'If that account exists, a reset link has been sent.' })
})
router.get('/inbox', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT subject,body,created FROM inbox WHERE user_id=? ORDER BY id DESC').all(u.id)) })

// V6 cache-poisoning payload: asset/support host reflected from X-Forwarded-Host
router.get('/config', (req, res) => {
  const host = forwardedHost(req)
  res.json({ product: 'FrontDesk', assetHost: `${forwardedProto(req)}://${host}`, supportUrl: `${forwardedProto(req)}://${host}/support`, currency: 'USD' })
})

// ---- admin (edge blocks /api/admin; reachable via X-Original-URL rewrite + this guard) ----
function admin(req, res) {
  const c = current(req)
  const u = c ? userById(c.id) : null
  if ((u && u.role === 'admin') || isInternal(req)) return u || { id: 0, username: 'internal', role: 'admin', name: 'internal' }  // V-intern
  res.status(403).json({ error: 'admin only' }); return null
}
router.get('/admin/users', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,username,role,name,email,tier FROM users').all()) })
router.get('/admin/reservations', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT * FROM reservations').all()) })
// V-rce: announcement template rendered server-side (Nunjucks SSTI)
router.post('/admin/announce', (req, res) => {
  const u = admin(req, res); if (!u) return
  try { res.json({ ok: true, rendered: render(String((req.body || {}).template || ''), { site: 'FrontDesk' }) }) }
  catch (e) { res.status(400).json({ error: 'render failed', detail: e.message }) }
})

module.exports = router
