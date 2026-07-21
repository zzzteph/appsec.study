// TenantHub auth. JWT (HS256) bearer carrying the platform role; a legacy cookie
// session (th_sid) for a couple of classic endpoints. Signing secret from
// config/app.secret — leakable via the export download traversal (V9), enabling
// the superadmin JWT forge (V10).
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const SECRET = fs.readFileSync(path.join(__dirname, 'config', 'app.secret'), 'utf8').trim()

function sign(u) {
  return jwt.sign({ id: u.id, uuid: u.uuid, username: u.username, platform_role: u.platform_role }, SECRET, { expiresIn: '1h' })
}
function verify(t) { try { return jwt.verify(t, SECRET) } catch { return null } }
function userFromReq(req) {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/)
  return m ? verify(m[1]) : null
}
function sidFromReq(req) {
  const m = (req.headers.cookie || '').match(/th_sid=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}
const bcryptHash = (p) => bcrypt.hashSync(p, 8)
const bcryptCheck = (p, h) => { try { return bcrypt.compareSync(p, h) } catch { return false } }
const md5 = (p) => crypto.createHash('md5').update(p).digest('hex')

module.exports = { SECRET, sign, verify, userFromReq, sidFromReq, bcryptHash, bcryptCheck, md5 }
