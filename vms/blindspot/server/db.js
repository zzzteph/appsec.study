// Blindspot / "Trackr" data model + deterministic seed. Real SQLite; the planted
// injections are BLIND (no data reflected, only true/false or timing) or
// SECOND-ORDER (stored safely, used unsafely later). Passwords are cleartext so
// a blind extraction is directly usable.
const Database = require('better-sqlite3')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')

db.exec(`
CREATE TABLE users ( id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT, email TEXT, created TEXT );
CREATE TABLE packages ( id INTEGER PRIMARY KEY, tracking TEXT, owner TEXT, status TEXT, carrier TEXT, eta TEXT, dest TEXT );
CREATE TABLE activity ( id INTEGER PRIMARY KEY, username TEXT, event TEXT, created TEXT );
CREATE TABLE addresses ( id INTEGER PRIMARY KEY, user_id INTEGER, label TEXT, line1 TEXT, city TEXT, zip TEXT );
CREATE TABLE feedback ( id INTEGER PRIMARY KEY, username TEXT, subject TEXT, body TEXT, created TEXT );
`)

// users (CLEARTEXT passwords — blind-SQLi extraction target is admin)
;[
  ['demo', 'demo', 'user', 'demo@trackr.test'],
  ['alice', 'alicepack1', 'user', 'alice@trackr.test'],
  ['bob', 'bobparcel', 'user', 'bob@trackr.test'],
  ['admin', 'trackr-adm1n', 'admin', 'admin@trackr.test'],
].forEach((u, i) => db.prepare('INSERT INTO users(id,username,password,role,email,created) VALUES (?,?,?,?,?,?)').run(i + 1, u[0], u[1], u[2], u[3], '2024-01-01'))

// packages
;[
  ['TRK1000001', 'demo', 'In transit', 'SwiftPost', '2024-06-10', 'Springfield'],
  ['TRK1000002', 'demo', 'Delivered', 'SwiftPost', '2024-05-28', 'Springfield'],
  ['TRK2000045', 'alice', 'Out for delivery', 'RapidShip', '2024-06-09', 'Rivertown'],
  ['TRK2000046', 'alice', 'Customs hold', 'RapidShip', '2024-06-14', 'Rivertown'],
  ['TRK3000077', 'bob', 'In transit', 'SwiftPost', '2024-06-11', 'Lakeside'],
  ['TRK9000001', 'admin', 'Delivered', 'Internal', '2024-05-01', 'HQ'],
].forEach(p => db.prepare('INSERT INTO packages(tracking,owner,status,carrier,eta,dest) VALUES (?,?,?,?,?,?)').run(p))

// activity (used by the second-order-SQLi endpoint)
;[['demo', 'Signed up'], ['demo', 'Tracked TRK1000001'], ['alice', 'Added address'], ['bob', 'Tracked TRK3000077']]
  .forEach(a => db.prepare('INSERT INTO activity(username,event,created) VALUES (?,?,?)').run(a[0], a[1], '2024-05-15'))

// addresses (IDOR target)
;[
  [1, 'Home', '14 Oak St', 'Springfield', '10001'], [2, 'Home', '88 Maple Ave', 'Rivertown', '20002'],
  [2, 'Work', '5 Commerce Pk', 'Rivertown', '20010'], [3, 'Home', '5 Pine Rd', 'Lakeside', '30003'],
].forEach(a => db.prepare('INSERT INTO addresses(user_id,label,line1,city,zip) VALUES (?,?,?,?,?)').run(a))

db.prepare("INSERT INTO feedback(username,subject,body,created) VALUES ('alice','Great service','Package arrived on time!','2024-05-20')").run()

module.exports = { db }
