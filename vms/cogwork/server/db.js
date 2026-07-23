const Database = require('better-sqlite3')
const { bcryptHash, md5 } = require('./auth')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')
db.exec(`
CREATE TABLE users ( id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, hash_algo TEXT, role TEXT, email TEXT );
CREATE TABLE workflows ( id INTEGER PRIMARY KEY, owner TEXT, name TEXT, description TEXT, config TEXT, private INTEGER );
`)
;[
  ['demo', 'demo', 'bcrypt', 'user', 'demo@cogwork.test'],
  ['mia', 'miaflows1', 'bcrypt', 'user', 'mia@cogwork.test'],
  ['sam', 'samworks22', 'bcrypt', 'user', 'sam@cogwork.test'],
  ['admin', 'qwerty123', 'md5', 'admin', 'admin@cogwork.test'],
].forEach((u, i) => db.prepare('INSERT INTO users(id,username,password,hash_algo,role,email) VALUES (?,?,?,?,?,?)').run(i + 1, u[0], u[3] === 'md5' ? md5(u[1]) : (u[2] === 'md5' ? md5(u[1]) : bcryptHash(u[1])), u[2], u[3], u[4]))
// fix: seed passwords with correct algo
db.prepare("UPDATE users SET password=? WHERE username='admin'").run(md5('qwerty123'))

;[
  ['demo', 'Daily digest', 'Send me a daily summary', '{"schedule":"0 9 * * *","channel":"email"}', 0],
  ['demo', 'Backup notifier', 'Ping on backup done', '{"schedule":"@daily"}', 0],
  ['mia', 'Deploy pipeline (private)', 'CI deploy to prod', '{"webhook_secret":"whsec_mia_9f2a","deploy_key":"AKIA-MIA-SECRET"}', 1],
  ['sam', 'Invoice sync (private)', 'Sync invoices', '{"stripe_key":"sk_live_sam_7b1c"}', 1],
  ['admin', 'Platform housekeeping', 'internal', '{"root_token":"cw_root_ffee00"}', 1],
].forEach((w, i) => db.prepare('INSERT INTO workflows(id,owner,name,description,config,private) VALUES (?,?,?,?,?,?)').run(i + 1, w[0], w[1], w[2], w[3], w[4]))

module.exports = { db }
