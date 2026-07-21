// Meridian ID auth. One HS256 secret signs both id_tokens and login sessions
// (loaded from config/app.secret — leakable via V13 SQLi / V14 debug, enabling
// the admin forge V5). verifyIdToken is deliberately lenient: it accepts
// alg:none (V4).
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const SECRET = fs.readFileSync(path.join(__dirname, 'config', 'app.secret'), 'utf8').trim()
const ISS = 'https://meridian.id'

function signIdToken(user, aud, scope) {
  return jwt.sign(
    { iss: ISS, sub: String(user.id), aud, email: user.email, name: user.name, preferred_username: user.username, role: user.role, scope },
    SECRET, { algorithm: 'HS256', expiresIn: '1h' }
  )
}
function signAccess(user, aud, scope) {
  return jwt.sign({ sub: String(user.id), aud, scope, role: user.role, typ: 'access' }, SECRET, { expiresIn: '1h' })
}
function signSession(user) {
  return jwt.sign({ sub: String(user.id), role: user.role, sess: true }, SECRET, { expiresIn: '7d' })
}

// Strict verify (session/access).
function verify(t) { try { return jwt.verify(t, SECRET) } catch { return null } }

// V4 — lenient id_token verify used by relying parties / introspection: if the
// token header says alg:none, it is accepted WITHOUT a signature check.
function verifyIdToken(t) {
  try {
    const [h] = t.split('.')
    const hdr = JSON.parse(Buffer.from(h, 'base64').toString('utf8'))
    if (hdr.alg === 'none') {
      const [, p] = t.split('.')
      return JSON.parse(Buffer.from(p, 'base64').toString('utf8'))
    }
    return jwt.verify(t, SECRET, { algorithms: ['HS256'] })
  } catch { return null }
}

function sessionFromReq(req) {
  const raw = req.headers.cookie || ''
  const m = raw.match(/mid_sess=([^;]+)/)
  return m ? verify(decodeURIComponent(m[1])) : null
}
function bearer(req) {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/)
  return m ? m[1] : null
}

const bcryptHash = (p) => bcrypt.hashSync(p, 8)
const bcryptCheck = (p, h) => { try { return bcrypt.compareSync(p, h) } catch { return false } }
const md5 = (p) => crypto.createHash('md5').update(p).digest('hex')

module.exports = { SECRET, ISS, signIdToken, signAccess, signSession, verify, verifyIdToken, sessionFromReq, bearer, bcryptHash, bcryptCheck, md5 }
