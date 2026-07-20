// Shared SQLite store (real SQL injection). Seeded with plentiful, realistic-looking content so a
// freshly generated mutation looks like a genuine, populated product.
const Database = require('better-sqlite3')
const { ADMIN_USER, ADMIN_PASS } = require('./secrets')
const C = require('./content')

const db = new Database(':memory:')
db.exec(`
CREATE TABLE users (
  id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT, email TEXT,
  display TEXT, bio TEXT, note TEXT, apikey TEXT
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL, stock INTEGER,
  rating REAL, description TEXT
);
CREATE TABLE posts (
  id INTEGER PRIMARY KEY, author TEXT, body TEXT, created TEXT, likes INTEGER, has_image INTEGER
);
`)

// ---- users: the app admin (chain target) + a couple of fixed accounts + many realistic users ----
const insU = db.prepare('INSERT INTO users(username,password,role,email,display,bio,note,apikey) VALUES (?,?,?,?,?,?,?,?)')
const ADMIN_KEY = 'ak_live_admin_' + Math.random().toString(16).slice(2, 10)
insU.run(ADMIN_USER, ADMIN_PASS, 'admin', 'root@maze.local', 'Root Admin', 'Keeps the lights on.', 'app administrator', ADMIN_KEY)
insU.run('alice', 'sunflower12', 'user', 'alice@maze.local', 'Alice Carter', C.pick(C.BIOS), '', 'ak_live_' + Math.random().toString(16).slice(2, 10))
insU.run('bob', 'qwerty2024', 'user', 'bob@maze.local', 'Bob Nguyen', C.pick(C.BIOS), '', 'ak_live_' + Math.random().toString(16).slice(2, 10))
insU.run('carol', 'letmein!', 'partner', 'carol@maze.local', 'Carol Patel', C.pick(C.BIOS), 'partner rep', 'ak_live_' + Math.random().toString(16).slice(2, 10))
const usernames = ['alice', 'bob', 'carol']
for (let i = 0; i < 56; i++) {
  const name = C.fullName(); const un = C.usernameFrom(name, i)
  usernames.push(un)
  insU.run(un, 'pw_' + Math.floor(C.R() * 0xffffff).toString(16), C.pick(C.ROLES), un + '@maze.local', name, C.pick(C.BIOS), '', 'ak_live_' + Math.floor(C.R() * 0xffffffff).toString(16))
}

// ---- products (a full catalog) ----
const insP = db.prepare('INSERT INTO products(name,category,price,stock,rating,description) VALUES (?,?,?,?,?,?)')
for (let i = 0; i < 60; i++) insP.run(C.productName(), C.pick(C.CATS), (C.int(500, 12000) / 100), C.int(0, 400), (C.int(30, 50) / 10), C.paragraph())

// ---- posts (a busy feed) ----
const insPost = db.prepare('INSERT INTO posts(author,body,created,likes,has_image) VALUES (?,?,?,?,?)')
for (let i = 0; i < 90; i++) insPost.run(C.pick(usernames), C.pick(C.POSTS), C.daysAgoISO(45), C.int(0, 240), C.chance(0.4) ? 1 : 0)

module.exports = { db, usernames }
