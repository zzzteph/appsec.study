// Blindspot auth. Passwords are stored in CLEARTEXT (so a blind-SQLi extraction
// yields a usable password, not a hash). JWT session.
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const SECRET = fs.readFileSync(path.join(__dirname, 'config', 'app.secret'), 'utf8').trim()
function sign(u) { return jwt.sign({ id: u.id, username: u.username, role: u.role }, SECRET, { expiresIn: '2h' }) }
function verify(t) { try { return jwt.verify(t, SECRET) } catch { return null } }
function userFromReq(req) { const m = (req.headers.authorization || '').match(/^Bearer (.+)$/); return m ? verify(m[1]) : null }
module.exports = { SECRET, sign, verify, userFromReq }
