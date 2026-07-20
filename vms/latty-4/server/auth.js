const jwt = require('jsonwebtoken')
const SECRET = 'latty4-projects-secret'

function sign(u) { return jwt.sign({ username: u.username, tenant: u.tenant }, SECRET, { expiresIn: '2h' }) }
function userFromReq(req) {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/)
  if (!m) return null
  try { return jwt.verify(m[1], SECRET) } catch { return null }
}
module.exports = { sign, userFromReq }
