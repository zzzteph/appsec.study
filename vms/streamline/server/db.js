const Database = require('better-sqlite3')
const crypto = require('crypto')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')
const md5 = (p) => crypto.createHash('md5').update(p).digest('hex')
db.exec(`
CREATE TABLE users ( id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, hash_algo TEXT, role TEXT );
CREATE TABLE rooms ( id INTEGER PRIMARY KEY, name TEXT, private INTEGER, members TEXT );
CREATE TABLE messages ( id INTEGER PRIMARY KEY, room_id INTEGER, sender TEXT, text TEXT, created TEXT );
`)
;[
  ['demo', 'demo', 'plain', 'user'], ['alice', 'alicechat', 'plain', 'user'], ['bob', 'bobchat', 'plain', 'user'],
  ['admin', md5('letmein99'), 'md5', 'admin'],
].forEach((u, i) => db.prepare('INSERT INTO users(id,username,password,hash_algo,role) VALUES (?,?,?,?,?)').run(i + 1, u[0], u[1], u[2], u[3]))
;[
  ['general', 0, 'demo,alice,bob,admin'],
  ['design-team', 1, 'alice,bob'],
  ['exec-private', 1, 'admin'],
].forEach((r, i) => db.prepare('INSERT INTO rooms(id,name,private,members) VALUES (?,?,?,?)').run(i + 1, r[0], r[1], r[2]))
;[
  [1, 'demo', 'hey team 👋'], [1, 'alice', 'welcome!'],
  [2, 'alice', 'new mockups are in the shared drive'], [2, 'bob', 'the figma password is design2024'],
  [3, 'admin', 'Q3 acquisition of Globex is confidential — do not leak'], [3, 'admin', 'prod db creds: dbadmin / Pr0dCreds!'],
].forEach(m => db.prepare("INSERT INTO messages(room_id,sender,text,created) VALUES (?,?,?, '2024-05-20T10:00:00Z')").run(m[0], m[1], m[2]))
module.exports = { db }
