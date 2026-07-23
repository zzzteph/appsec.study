const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const SECRET = fs.readFileSync(path.join(__dirname, 'config', 'app.secret'), 'utf8').trim()
function sign(u) { return jwt.sign({ id: u.id, username: u.username, role: u.role }, SECRET, { expiresIn: '2h' }) }
function verify(t) { try { return jwt.verify(t, SECRET) } catch { return null } }
function userFromReq(req) { const m = (req.headers.authorization || '').match(/^Bearer (.+)$/); return m ? verify(m[1]) : null }
const bcryptHash = (p) => bcrypt.hashSync(p, 8)
const bcryptCheck = (p, h) => { try { return bcrypt.compareSync(p, h) } catch { return false } }
const md5 = (p) => crypto.createHash('md5').update(p).digest('hex')
module.exports = { SECRET, sign, verify, userFromReq, bcryptHash, bcryptCheck, md5 }
