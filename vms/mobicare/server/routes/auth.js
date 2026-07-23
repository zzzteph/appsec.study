// Auth: password login + OTP login, reset, continue. Planted: V1 (OTP verify
// accepts ANY 6-digit code -> take over any line by requesting an OTP for its
// MSISDN), V6 (enumeration), V13 (reset poisoning via Host header -> inbox),
// V-redir (open redirect).
const express = require('express')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const router = express.Router()
const { db, subscriber, subByName } = require('./_util')
const { SECRET, sign, bcryptHash, bcryptCheck, md5 } = require('../auth')
const mailer = require('../mailer')

function setSid(res, s) { res.setHeader('Set-Cookie', `mc_sid=${jwt.sign({ id: s.id, sid: true }, SECRET, { expiresIn: '7d' })}; Path=/; SameSite=Lax; Max-Age=604800`) }
const checkPw = (s, p) => s.hash_algo === 'md5' ? md5(p) === s.password : bcryptCheck(p, s.password)
const meCard = (s) => ({ id: s.id, uuid: s.uuid, username: s.username, msisdn: s.msisdn, email: s.email, name: s.name, role: s.role, plan: s.plan, tier: s.tier, data_allowance_gb: s.data_allowance_gb, kyc_status: s.kyc_status, twofa_enabled: s.twofa_enabled, address: s.address, avatar_seed: s.avatar_seed })

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const s = subByName(username || '')
  if (!s) return res.status(401).json({ error: 'No account with that number/username' })  // V6
  if (!checkPw(s, password || '')) return res.status(401).json({ error: 'Incorrect password' })
  setSid(res, s); res.json({ access: sign(s), user: meCard(s) })
})

// OTP request — delivers a code to the subscriber's inbox (in-band).
router.post('/otp/request', (req, res) => {
  const { msisdn } = req.body || {}
  const s = subByName(msisdn || '')
  if (!s) return res.status(404).json({ error: 'No account with that number' })  // V6
  const code = String(100000 + (crypto.randomBytes(3).readUIntBE(0, 3) % 900000))
  db.prepare("INSERT INTO otp_challenges(subscriber_id,code,purpose,used,created) VALUES (?,?, 'login', 0, datetime('now'))").run(s.id, code)
  mailer.bind(db); mailer.deliver(s.id, { subject: 'Your MobiCare login code', body: `Your one-time code is ${code}. It expires in 10 minutes.`, otp: code })
  res.json({ ok: true, message: 'A one-time code was sent to your number.' })
})

// V1 — OTP verify accepts ANY 6-digit code (the real code is never checked).
router.post('/otp/verify', (req, res) => {
  const { msisdn, code } = req.body || {}
  const s = subByName(msisdn || '')
  if (!s) return res.status(404).json({ error: 'unknown number' })
  if (!/^\d{6}$/.test(String(code || ''))) return res.status(400).json({ error: 'enter the 6-digit code' })
  setSid(res, s); res.json({ access: sign(s), user: meCard(s) })
})

router.post('/logout', (req, res) => { res.setHeader('Set-Cookie', 'mc_sid=; Path=/; Max-Age=0'); res.json({ ok: true }) })
router.post('/refresh', (req, res) => {
  const m = (req.headers.cookie || '').match(/mc_sid=([^;]+)/); if (!m) return res.status(401).json({ error: 'no session' })
  try { const d = jwt.verify(decodeURIComponent(m[1]), SECRET); res.json({ access: sign(subscriber(d.id)), user: meCard(subscriber(d.id)) }) } catch { res.status(401).json({ error: 'invalid session' }) }
})

// V13 — reset link from the (spoofable) Host header, delivered to the inbox.
router.post('/reset', (req, res) => {
  const { msisdn } = req.body || {}
  const s = subByName(msisdn || '')
  if (!s) return res.status(404).json({ error: 'No account with that number' })  // V6
  const token = crypto.randomBytes(16).toString('hex')
  db.prepare("INSERT INTO password_resets(subscriber_id,token,expires,used) VALUES (?,?,datetime('now','+1 hour'),0)").run(s.id, token)
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'my.mobicare.test'
  mailer.bind(db); mailer.deliver(s.id, { subject: 'Reset your MobiCare password', body: `Reset here: https://${host}/reset?token=${token}`, resetToken: token })
  res.json({ ok: true, message: 'Reset link sent to your inbox.' })
})
router.post('/reset/confirm', (req, res) => {
  const { token, password } = req.body || {}
  const row = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 0').get(token || '')
  if (!row) return res.status(400).json({ error: 'invalid or expired token' })
  db.prepare("UPDATE subscribers SET password = ?, hash_algo='bcrypt' WHERE id = ?").run(bcryptHash(password || 'changeme'), row.subscriber_id)
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(row.id)
  res.json({ ok: true, message: 'Password updated.' })
})
router.get('/continue', (req, res) => res.redirect(req.query.next || '/'))  // V-redir

module.exports = router
