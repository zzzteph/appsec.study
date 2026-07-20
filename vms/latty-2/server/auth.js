const jwt = require('jsonwebtoken')
const SECRET = 'latty2-ops-secret'

function sign(u) { return jwt.sign({ username: u.username, role: u.role }, SECRET, { expiresIn: '2h' }) }
function userFromReq(req) {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/)
  if (!m) return null
  try { return jwt.verify(m[1], SECRET) } catch { return null }
}
module.exports = { sign, userFromReq }
