// Auth: login/register/logout/refresh, reset, 2FA. Planted: V4 (host-poisoned
// reset link delivered to the in-app inbox), V6 (2FA confirm accepts any 6-digit
// code / trusts client), V-enum (user enumeration), V-redir (open redirect).
const express = require('express')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const router = express.Router()
const { db, customer, customerByName } = require('./_util')
const { SECRET, sign, bcryptHash, bcryptCheck, md5 } = require('../auth')
const mailer = require('../mailer')

function setSid(res, c) {
  res.setHeader('Set-Cookie', `nw_sid=${jwt.sign({ id: c.id, sid: true }, SECRET, { expiresIn: '7d' })}; Path=/; SameSite=Lax; Max-Age=604800`)
}
const checkPw = (c, p) => c.hash_algo === 'md5' ? md5(p) === c.password : bcryptCheck(p, c.password)
const meCard = (c) => ({
  id: c.id, uuid: c.uuid, username: c.username, email: c.email, name: c.name, role: c.role,
  phone: c.phone, dob: c.dob, address: c.address, kyc_status: c.kyc_status, tier: c.tier,
  daily_limit: c.daily_limit, twofa_enabled: c.twofa_enabled, avatar_seed: c.avatar_seed,
})

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const c = customerByName(username || '')
  if (!c) return res.status(401).json({ error: 'No customer with that username' })  // V-enum
  if (!checkPw(c, password || '')) return res.status(401).json({ error: 'Incorrect password' })
  setSid(res, c)
  res.json({ access: sign(c), user: meCard(c) })
})

router.post('/register', (req, res) => {
  const { username, email, password, name } = req.body || {}
  if (!username || !email || !password) return res.status(400).json({ error: 'username, email, password required' })
  if (customerByName(username)) return res.status(409).json({ error: 'username taken' })
  const id = (db.prepare('SELECT MAX(id) m FROM customers').get().m || 0) + 1
  db.prepare(`INSERT INTO customers(id,uuid,username,email,password,hash_algo,role,name,avatar_seed,phone,dob,address,kyc_status,tier,daily_limit,twofa_enabled,twofa_secret,created)
    VALUES (?,?,?,?,?, 'bcrypt','customer',?,?, '', '', '', 'pending','standard',1000,0,'JBSWY3DPEHPK3PXP',datetime('now'))`)
    .run(id, 'cust_' + id, username, email, bcryptHash(password), name || username, username)
  const c = customer(id)
  db.prepare("INSERT INTO accounts(customer_id,type,number,balance,currency,status,opened) VALUES (?,?,?,?,?,?,datetime('now'))")
    .run(id, 'checking', '****' + (1000 + id), 100.00, 'USD', 'active')
  mailer.bind(db); mailer.deliver(id, { subject: 'Welcome to Northwind Bank', body: 'Your account is open with a $100 welcome balance.' })
  setSid(res, c)
  res.json({ access: sign(c), user: meCard(c) })
})

router.post('/logout', (req, res) => { res.setHeader('Set-Cookie', 'nw_sid=; Path=/; Max-Age=0'); res.json({ ok: true }) })

router.post('/refresh', (req, res) => {
  const m = (req.headers.cookie || '').match(/nw_sid=([^;]+)/)
  if (!m) return res.status(401).json({ error: 'no session' })
  try { const d = jwt.verify(decodeURIComponent(m[1]), SECRET); const c = customer(d.id); res.json({ access: sign(c), user: meCard(c) }) }
  catch { res.status(401).json({ error: 'invalid session' }) }
})

// V4 — reset link built from the (spoofable) Host header; delivered to the
// target's in-app inbox (token also stored, readable via the inbox IDOR V5).
router.post('/reset', (req, res) => {
  const { email } = req.body || {}
  const c = customerByName(email || '')
  if (!c) return res.status(404).json({ error: 'No customer with that email' })  // V-enum
  const token = crypto.randomBytes(16).toString('hex')
  db.prepare("INSERT INTO password_resets(customer_id,token,expires,used) VALUES (?,?,datetime('now','+1 hour'),0)").run(c.id, token)
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'northwind.bank'
  mailer.bind(db)
  mailer.deliver(c.id, { subject: 'Reset your Northwind password', body: `Reset your password: https://${host}/reset?token=${token}`, resetToken: token })
  res.json({ ok: true, message: 'Reset link sent to your inbox.' })
})
router.post('/reset/confirm', (req, res) => {
  const { token, password } = req.body || {}
  const row = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0').get(token || '')
  if (!row) return res.status(400).json({ error: 'invalid or expired token' })
  db.prepare("UPDATE customers SET password = ?, hash_algo='bcrypt' WHERE id = ?").run(bcryptHash(password || 'changeme'), row.customer_id)
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(row.id)
  res.json({ ok: true, message: 'Password updated.' })
})

// V6 — step-up 2FA accepts any 6-digit code (no real TOTP check).
router.post('/2fa/verify', (req, res) => {
  const code = String((req.body || {}).code || '')
  if (/^\d{6}$/.test(code)) return res.json({ ok: true, verified: true })
  res.status(400).json({ error: 'invalid code' })
})

// V-redir — open redirect on the post-login continue target.
router.get('/continue', (req, res) => res.redirect(req.query.next || '/'))

module.exports = router
