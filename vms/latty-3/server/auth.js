const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

const SECRET = 'latty3-backup-secret'

// Console credentials are read from the same config file that the XXE can leak — the console
// account reuses the service db password (planted "password reuse").
const conf = {}
for (const line of fs.readFileSync(path.join(__dirname, 'config', 'service.conf'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([\w.]+)\s*=\s*(.*)$/)
  if (m) conf[m[1]] = m[2].trim()
}
const CONSOLE_USER = conf['console.user']
const CONSOLE_PASS = conf['db.password']

function sign(u) { return jwt.sign({ username: u, role: 'admin' }, SECRET, { expiresIn: '2h' }) }
function userFromReq(req) {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/)
  if (!m) return null
  try { return jwt.verify(m[1], SECRET) } catch { return null }
}
module.exports = { sign, userFromReq, CONSOLE_USER, CONSOLE_PASS }
