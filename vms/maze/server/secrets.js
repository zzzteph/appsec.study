const fs = require('fs')
const path = require('path')

const CONF_PATH = path.join(__dirname, 'config', 'app.conf')
const KEY_PATH = path.join(__dirname, 'secret', 'app.key')

const conf = {}
for (const line of fs.readFileSync(CONF_PATH, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([\w.]+)\s*=\s*(.*)$/)
  if (m) conf[m[1]] = m[2].trim()
}

const APP_SECRET = fs.readFileSync(KEY_PATH, 'utf8').trim()   // HS256 signing key (LFI-leakable → forge admin)
const ADMIN_USER = conf['admin.user']
const ADMIN_PASS = conf['admin.password']                     // also seeded into the users table (SQLi/XXE-leakable)

module.exports = { conf, APP_SECRET, ADMIN_USER, ADMIN_PASS, CONF_PATH, KEY_PATH }
