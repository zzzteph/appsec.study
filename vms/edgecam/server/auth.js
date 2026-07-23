// EdgeCam auth. Device-style: cleartext credentials, JWT session. The admin guard
// ALSO trusts requests that claim to come from the local network via forwarded
// headers (V4 auth bypass) — a very common embedded-device flaw.
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const SECRET = fs.readFileSync(path.join(__dirname, 'config', 'app.secret'), 'utf8').trim()
function sign(u) { return jwt.sign({ id: u.id, username: u.username, role: u.role }, SECRET, { expiresIn: '4h' }) }
function verify(t) { try { return jwt.verify(t, SECRET) } catch { return null } }
function userFromReq(req) { const m = (req.headers.authorization || '').match(/^Bearer (.+)$/); return m ? verify(m[1]) : null }
// V4 — "local requests are trusted": a forwarded-for/real-ip of 127.0.0.1 grants
// admin without any credentials.
function isTrustedLocal(req) {
  const xff = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')
  return /(^|,\s*)127\.0\.0\.1/.test(xff) || xff === 'localhost'
}
module.exports = { SECRET, sign, verify, userFromReq, isTrustedLocal }
