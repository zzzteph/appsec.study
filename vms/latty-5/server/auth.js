const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

// HS256 signing secret loaded from a file on disk. If that file is disclosed (see the LFI), the
// secret is enough to FORGE a token with role:admin.
const SECRET = fs.readFileSync(path.join(__dirname, 'secret', 'jwt.secret'), 'utf8').trim()

function sign(u) { return jwt.sign({ username: u.username, role: u.role }, SECRET, { expiresIn: '2h' }) }
function userFromReq(req) {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/)
  if (!m) return null
  try { return jwt.verify(m[1], SECRET) } catch { return null }
}
module.exports = { sign, userFromReq, SECRET }
