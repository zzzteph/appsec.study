// RollHouse auth. JWT (HS256) access tokens + a legacy cookie session used by a
// couple of "classic" endpoints. The signing secret is loaded from a file on
// disk (config/app.secret) — the same file the statements download endpoint can
// be tricked into reading (V16 LFI), which is what makes the admin JWT forge
// (V14) possible once the secret leaks.
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const SECRET = fs.readFileSync(path.join(__dirname, 'config', 'app.secret'), 'utf8').trim()
const ACCESS_TTL = '1h'

function sign(u) {
  return jwt.sign(
    { id: u.id, uuid: u.uuid, username: u.username, role: u.role, vip: u.vip_tier },
    SECRET,
    { expiresIn: ACCESS_TTL }
  )
}

function verify(t) {
  try { return jwt.verify(t, SECRET) } catch { return null }
}

// Bearer token -> claims (does not re-load the player; claims are trusted like a
// real stateless API would).
function userFromReq(req) {
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer (.+)$/)
  if (!m) return null
  return verify(m[1])
}

// Legacy cookie session (rh_sid). Deliberately has no CSRF token — the couple of
// endpoints that trust it (email change, referral claim) are cross-site
// forgeable (V18).
function sidFromReq(req) {
  const raw = req.headers.cookie || ''
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i) === 'rh_sid') return decodeURIComponent(part.slice(i + 1))
  }
  return null
}

const bcryptHash = (p) => bcrypt.hashSync(p, 8)
const bcryptCheck = (p, h) => { try { return bcrypt.compareSync(p, h) } catch { return false } }
const md5 = (p) => crypto.createHash('md5').update(p).digest('hex')

module.exports = { SECRET, sign, verify, userFromReq, sidFromReq, bcryptHash, bcryptCheck, md5 }
