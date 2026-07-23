// Prism data model + deterministic seed. Real SQLite with a real `sales` table
// the query-builder runs against (so the query-builder SQLi, V1, is genuine and
// UNION-dumpable).
const Database = require('better-sqlite3')
const crypto = require('crypto')
const { bcryptHash, md5 } = require('./auth')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')

db.exec(`
CREATE TABLE users ( id INTEGER PRIMARY KEY, uuid TEXT, username TEXT UNIQUE, email TEXT, password TEXT, hash_algo TEXT, role TEXT, name TEXT, avatar_seed TEXT, created TEXT );
CREATE TABLE sales ( id INTEGER PRIMARY KEY, region TEXT, product TEXT, amount REAL, rep TEXT );
CREATE TABLE datasets ( id INTEGER PRIMARY KEY, owner_id INTEGER, name TEXT, table_name TEXT, description TEXT, created TEXT );
CREATE TABLE queries ( id INTEGER PRIMARY KEY, owner_id INTEGER, name TEXT, spec TEXT, description TEXT, created TEXT );
CREATE TABLE dashboards ( id INTEGER PRIMARY KEY, owner_id INTEGER, name TEXT, is_public INTEGER, share_token TEXT, description TEXT, created TEXT );
CREATE TABLE config ( key TEXT PRIMARY KEY, value TEXT );
CREATE TABLE collect ( id INTEGER PRIMARY KEY, data TEXT, ip TEXT, created TEXT );
CREATE TABLE staff_notes ( id INTEGER PRIMARY KEY, author TEXT, note TEXT, created TEXT );
`)

// users
;[
  ['demo', 'demo@prism.test', 'demo', 'bcrypt', 'analyst', 'Demo Analyst'],
  ['jordan', 'jordan@acme.test', 'jordan2024', 'bcrypt', 'analyst', 'Jordan Lee'],
  ['priya', 'priya@acme.test', 'priyadata', 'bcrypt', 'analyst', 'Priya Nair'],
  ['admin', 'admin@prism.test', 'monkey99', 'md5', 'admin', 'Site Admin'],
  ['root', 'ops@prism.test', 'Pr!smR00t#x9', 'bcrypt', 'admin', 'Operations'],
].forEach((u, i) => { const id = i + 1; db.prepare('INSERT INTO users(id,uuid,username,email,password,hash_algo,role,name,avatar_seed,created) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id, 'usr_' + id, u[0], u[1], u[3] === 'md5' ? md5(u[2]) : bcryptHash(u[2]), u[3], u[4], u[5], u[0], '2023-01-01') })

// sales data
const regions = ['North', 'South', 'East', 'West']; const products = ['Widget', 'Gadget', 'Gizmo', 'Doohickey']; const reps = ['Lee', 'Nair', 'Ortiz', 'Chen']
let sid = 1
for (let i = 0; i < 40; i++) db.prepare('INSERT INTO sales(id,region,product,amount,rep) VALUES (?,?,?,?,?)').run(sid++, regions[i % 4], products[(i * 3) % 4], 500 + (i * 137) % 4000, reps[(i * 2) % 4])

// datasets
;[[1, 'Sales 2024', 'sales', 'All sales transactions'], [2, 'Sales by region', 'sales', 'Regional rollup']]
  .forEach(d => db.prepare('INSERT INTO datasets(owner_id,name,table_name,description,created) VALUES (?,?,?,?,?)').run(d[0], d[1], d[2], d[3], '2024-01-01'))

// saved queries (name is rendered in admin + exported to CSV -> XSS / formula injection targets)
;[[1, 'Top regions', 'Revenue by region'], [2, 'Q1 pipeline (confidential)', 'Jordan private forecast'], [3, 'Headcount plan', 'Priya HR analytics']]
  .forEach(q => db.prepare("INSERT INTO queries(owner_id,name,spec,description,created) VALUES (?,?, 'SELECT region, SUM(amount) FROM sales GROUP BY region', ?, '2024-02-01')").run(q[0], q[1], q[2]))

// dashboards (private = IDOR targets; one public with a token)
;[
  [1, 'My Sales Overview', 0, null, 'Personal dashboard'],
  [2, 'Exec Board — CONFIDENTIAL', 0, null, 'Jordan private exec metrics'],
  [3, 'HR Analytics — RESTRICTED', 0, null, 'Priya restricted headcount'],
  [1, 'Public Sales Demo', 1, crypto.createHash('sha1').update('pub-dash').digest('hex').slice(0, 16), 'Shared demo'],
].forEach(d => db.prepare('INSERT INTO dashboards(owner_id,name,is_public,share_token,description,created) VALUES (?,?,?,?,?,?)').run(d[0], d[1], d[2], d[3], d[4], '2024-03-01'))

db.prepare("INSERT INTO staff_notes(author,note,created) VALUES ('root','Report templates render server-side in the builder. Rotate config/app.secret before audit.','2024-01-02')").run()
;[['product', 'Prism'], ['report_template', 'Report: {{ title }} — total {{ total }} across {{ rows }} rows.']]
  .forEach(c => db.prepare('INSERT INTO config(key,value) VALUES (?,?)').run(c[0], c[1]))

module.exports = { db }
