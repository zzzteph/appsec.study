// Auth: login/register/logout/refresh, password reset, 2FA, and a post-login
// redirect. Planted: V-Reset (host-poisoned reset link -> in-app inbox),
// V17 (2FA accepts any 6-digit code), V19 (user enumeration), V15 (open redirect).
const express = require('express')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const router = express.Router()
const { db, player, playerByName, playerByEmail, pub } = require('./_util')
const { SECRET, sign, bcryptHash, bcryptCheck, md5 } = require('../auth')
const mailer = require('../mailer')

function setSid(res, p) {
  const sid = jwt.sign({ id: p.id, sid: true }, SECRET, { expiresIn: '7d' })
  // Legacy session cookie. SameSite=None + no CSRF token -> the endpoints that
  // trust it are cross-site forgeable (V18).
  res.setHeader('Set-Cookie', `rh_sid=${sid}; Path=/; SameSite=None; Max-Age=604800`)
}
function checkPw(p, plain) {
  return p.hash_algo === 'md5' ? md5(plain) === p.password : bcryptCheck(plain, p.password)
}
function meCard(p) {
  return {
    id: p.id, uuid: p.uuid, username: p.username, email: p.email, display_name: p.display_name,
    avatar_seed: p.avatar_seed, bio: p.bio, role: p.role, vip_tier: p.vip_tier, kyc_status: p.kyc_status,
    balance: p.balance, bonus_balance: p.bonus_balance, wager_met: p.wager_met,
    wager_required: p.wager_required, wager_progress: p.wager_progress, twofa_enabled: p.twofa_enabled,
    referral_code: p.referral_code, country: p.country,
  }
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const p = playerByName(username) || playerByEmail(username)
  // V19 — user enumeration: distinct messages for "no such account" vs "wrong password".
  if (!p) return res.status(401).json({ error: 'No account with that username' })
  if (!checkPw(p, password || '')) return res.status(401).json({ error: 'Incorrect password' })
  db.prepare("UPDATE players SET client_seed = client_seed WHERE id = ?").run(p.id)
  setSid(res, p)
  res.json({ access: sign(p), user: meCard(p) })
})

router.post('/register', (req, res) => {
  const { username, email, password } = req.body || {}
  if (!username || !password || !email) return res.status(400).json({ error: 'username, email, password required' })
  if (playerByName(username)) return res.status(409).json({ error: 'Username already taken' })
  const id = (db.prepare('SELECT MAX(id) m FROM players').get().m || 0) + 1
  db.prepare(`INSERT INTO players
    (id,uuid,username,email,password,hash_algo,role,display_name,avatar_seed,bio,vip_tier,kyc_status,
     wager_met,wager_required,wager_progress,balance,bonus_balance,twofa_enabled,twofa_secret,
     referral_code,referred_by,client_seed,nonce,phone,dob,country,created)
    VALUES (@id,@uuid,@username,@email,@password,'bcrypt','player',@display,@username,'',
     'bronze','none',0,0,0,0,25,0,'JBSWY3DPEHPK3PXP',@refcode,@refby,@seed,1,'','','US',datetime('now'))`)
    .run({
      id, uuid: 'p_' + crypto.randomBytes(4).toString('hex'), username, email,
      password: bcryptHash(password), display: username,
      refcode: 'RH-' + username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8),
      refby: (req.body.ref || null), seed: username + '-seed',
    })
  const p = player(id)
  mailer.bind(db); mailer.deliver(id, { subject: 'Welcome to RollHouse 🎰', body: 'Your 25 RC welcome bonus is ready. Good luck!' })
  setSid(res, p)
  res.json({ access: sign(p), user: meCard(p) })
})

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'rh_sid=; Path=/; Max-Age=0')
  res.json({ ok: true })
})

// Re-mints an access token from the CURRENT db role (so a re-login/refresh after
// V9 yields a staff token).
router.post('/refresh', (req, res) => {
  const raw = req.headers.cookie || ''
  const m = raw.match(/rh_sid=([^;]+)/)
  if (!m) return res.status(401).json({ error: 'no session' })
  try {
    const d = jwt.verify(decodeURIComponent(m[1]), SECRET)
    const p = player(d.id)
    if (!p) return res.status(401).json({ error: 'no session' })
    res.json({ access: sign(p), user: meCard(p) })
  } catch { res.status(401).json({ error: 'invalid session' }) }
})

// V-Reset — reset link is built from the (spoofable) Host header and delivered
// to the target's in-app inbox; the token is readable there (and via V3).
router.post('/reset', (req, res) => {
  const { email } = req.body || {}
  const p = playerByEmail(email) || playerByName(email)
  if (!p) return res.status(404).json({ error: 'No account with that email' }) // V19
  const token = crypto.randomBytes(16).toString('hex')
  db.prepare("INSERT INTO password_resets(player_id,token,expires,used) VALUES (?,?,datetime('now','+1 hour'),0)").run(p.id, token)
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rollhouse.bet'
  const link = `https://${host}/reset?token=${token}`
  mailer.bind(db)
  mailer.deliver(p.id, { subject: 'Reset your RollHouse password', body: `Click to reset your password: ${link}`, resetToken: token })
  res.json({ ok: true, message: 'Password reset link sent to your inbox.' })
})

router.post('/reset/confirm', (req, res) => {
  const { token, password } = req.body || {}
  const row = db.prepare("SELECT * FROM password_resets WHERE token = ? AND used = 0").get(token || '')
  if (!row) return res.status(400).json({ error: 'invalid or expired token' })
  db.prepare("UPDATE players SET password = ?, hash_algo = 'bcrypt' WHERE id = ?").run(bcryptHash(password || 'changeme'), row.player_id)
  db.prepare("UPDATE password_resets SET used = 1 WHERE id = ?").run(row.id)
  res.json({ ok: true, message: 'Password updated. You can now log in.' })
})

// 2FA. setup is a normal decoy; verify is V17 (any 6-digit code passes — no real
// TOTP validation), which the withdrawal flow also relies on.
router.post('/2fa/setup', (req, res) => {
  const secret = 'JBSWY3DPEHPK3PXP'
  res.json({ secret, otpauth: `otpauth://totp/RollHouse?secret=${secret}&issuer=RollHouse` })
})
router.post('/2fa/verify', (req, res) => {
  const code = String((req.body || {}).code || '')
  if (/^\d{6}$/.test(code)) return res.json({ ok: true, verified: true }) // V17
  res.status(400).json({ error: 'invalid code' })
})

// V15 — open redirect (post-login "continue" target is not validated).
router.get('/continue', (req, res) => {
  const next = req.query.next || '/'
  res.redirect(next)
})

module.exports = router
