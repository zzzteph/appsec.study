const jwt = require('jsonwebtoken')
const SECRET = 'latty1-blog-secret'

function sign(u) {
  return jwt.sign({ id: u.id, username: u.username, role: u.role }, SECRET, { expiresIn: '2h' })
}
function userFromReq(req) {
  const h = req.headers.authorization || ''
  const m = h.match(/^Bearer (.+)$/)
  if (!m) return null
  try { return jwt.verify(m[1], SECRET) } catch { return null }
}
module.exports = { sign, userFromReq }
