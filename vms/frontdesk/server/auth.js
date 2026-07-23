const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const SECRET = fs.readFileSync(path.join(__dirname, 'config', 'app.secret'), 'utf8').trim()
function sign(u) { return jwt.sign({ id: u.id, username: u.username, role: u.role }, SECRET, { expiresIn: '6h' }) }
function verify(t) { try { return jwt.verify(t, SECRET) } catch { return null } }
function bearer(req) { const m = (req.headers.authorization || '').match(/^Bearer (.+)$/); return m ? verify(m[1]) : null }
function cookieToken(req) { const m = (req.headers.cookie || '').match(/fd_sess=([^;]+)/); return m ? verify(decodeURIComponent(m[1])) : null }
// A request is treated as coming from the trusted internal network if its
// forwarded-for chain contains a loopback address (planted: the edge forwards
// the client-supplied XFF unsanitised, so this is attacker-controllable).
function isInternal(req) {
  const xff = String(req.headers['x-forwarded-for'] || '')
  return /(^|[ ,])(127\.0\.0\.1|::1|localhost)([ ,]|$)/.test(xff)
}
module.exports = { SECRET, sign, verify, bearer, cookieToken, isInternal }
