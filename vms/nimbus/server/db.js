// Nimbus data model + deterministic seed (in-memory SQLite, rebuilt each boot).
// File contents live in the DB; the download endpoint (V4) reads from a storage
// dir with traversal. Real SQLite so the file-search SQLi (V9) is UNION-dumpable.
const Database = require('better-sqlite3')
const crypto = require('crypto')
const { bcryptHash, md5 } = require('./auth')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')

db.exec(`
CREATE TABLE users (
  id INTEGER PRIMARY KEY, uuid TEXT, username TEXT UNIQUE, email TEXT, password TEXT,
  hash_algo TEXT, role TEXT, name TEXT, avatar_seed TEXT, quota_gb REAL, used_mb REAL, created TEXT
);
CREATE TABLE files (
  id INTEGER PRIMARY KEY, owner_id INTEGER, folder_id INTEGER, name TEXT, mime TEXT,
  size REAL, content TEXT, is_folder INTEGER, created TEXT
);
CREATE TABLE shares (
  id INTEGER PRIMARY KEY, file_id INTEGER, owner_id INTEGER, token TEXT, password TEXT,
  permission TEXT, shared_with_user_id INTEGER, expires TEXT, created TEXT
);
CREATE TABLE comments ( id INTEGER PRIMARY KEY, file_id INTEGER, author_id INTEGER, author_name TEXT, body TEXT, created TEXT );
CREATE TABLE staff_notes ( id INTEGER PRIMARY KEY, author TEXT, note TEXT, created TEXT );
CREATE TABLE audit ( id INTEGER PRIMARY KEY, actor TEXT, action TEXT, detail TEXT, created TEXT );
CREATE TABLE config ( key TEXT PRIMARY KEY, value TEXT );
CREATE TABLE collect ( id INTEGER PRIMARY KEY, data TEXT, ip TEXT, created TEXT );
`)

// ---- users -------------------------------------------------------------------
// [username,email,plain,algo,role,name,quota]
const U = [
  ['demo',         'demo@nimbus.test',   'demo',         'bcrypt', 'user',  'Demo User',    10],
  ['alice.design', 'alice@acme.test',    'Design2024!',  'bcrypt', 'user',  'Alice Turner', 50],
  ['bob.eng',      'bob@acme.test',      'bobengineer',  'bcrypt', 'user',  'Bob Mercer',   50],
  ['carol.legal',  'carol@acme.test',    'carollegal1',  'bcrypt', 'user',  'Carol Diaz',   20],
  ['admin',        'admin@nimbus.test',  'flower',       'md5',    'admin', 'Site Admin',   999],
  ['root',         'ops@nimbus.test',    'N1mbus#R00t!x','bcrypt', 'admin', 'Operations',   999],
]
const insU = db.prepare('INSERT INTO users(id,uuid,username,email,password,hash_algo,role,name,avatar_seed,quota_gb,used_mb,created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
// r = [username,email,plain,algo,role,name,quota]
U.forEach((r, i) => { const id = i + 1; insU.run(id, 'usr_' + id, r[0], r[1], r[3] === 'md5' ? md5(r[2]) : bcryptHash(r[2]), r[3], r[4], r[5], r[0], r[6], 120 + id * 40, '2023-01-01') })

// ---- files (private sensitive files = IDOR targets) -------------------------
const insF = db.prepare('INSERT INTO files(owner_id,folder_id,name,mime,size,content,is_folder,created) VALUES (?,?,?,?,?,?,?,?)')
const F = [
  [1, 0, 'Projects', 'folder', 0, '', 1], [1, 0, 'Welcome.txt', 'text/plain', 0.2, 'Welcome to Nimbus! Store and share your files.', 0],
  [1, 1, 'notes.txt', 'text/plain', 0.3, 'My personal notes. Buy milk.', 0],
  [2, 0, 'Q3 Roadmap.docx', 'application/msword', 88, 'CONFIDENTIAL — Q3 product roadmap and launch dates.', 0],
  [2, 0, 'salary-review.xlsx', 'application/vnd.ms-excel', 41, 'PRIVATE — comp review: Alice $180k, Bob $165k, Carol $150k.', 0],
  [3, 0, 'prod-secrets.env', 'text/plain', 1, 'DB_PASSWORD=Pr0dDbP@ss\nSTRIPE_KEY=sk_live_51xTESTkeyfake\nJWT_SECRET=leaked-in-a-file', 0],
  [3, 0, 'architecture.pdf', 'application/pdf', 240, 'Internal architecture — service topology and credentials appendix.', 0],
  [4, 0, 'NDA-draft.docx', 'application/msword', 55, 'RESTRICTED — acquisition NDA draft, counterparties named inside.', 0],
]
F.forEach(f => insF.run(f[0], f[1], f[2], f[3], f[4], f[5], f[6], '2024-04-01'))

// ---- shares ------------------------------------------------------------------
// demo public link (no password); alice public link WITH password (V2 bypass);
// bob shares a file to demo as READ-only collaborator (V3 privesc target).
const insS = db.prepare('INSERT INTO shares(file_id,owner_id,token,password,permission,shared_with_user_id,expires,created) VALUES (?,?,?,?,?,?,?,?)')
insS.run(2, 1, crypto.createHash('sha1').update('welcome-share').digest('hex').slice(0, 16), null, 'read', null, null, '2024-05-01')
insS.run(4, 2, crypto.createHash('sha1').update('roadmap-share').digest('hex').slice(0, 16), 'launch2024', 'read', null, null, '2024-05-01')
insS.run(7, 3, null, null, 'read', 1, null, '2024-05-01')   // bob shares prod-secrets.env (file 7) to demo (user 1), read-only

// ---- comments (benign; stored-XSS lands here at runtime, V6) -----------------
db.prepare("INSERT INTO comments(file_id,author_id,author_name,body,created) VALUES (2,1,'Demo User','Thanks for sharing!','2024-05-02')").run()

db.prepare("INSERT INTO staff_notes(author,note,created) VALUES ('root','Share-notification templates render server-side in admin. Rotate config/app.secret before audit.','2024-01-02')").run()
db.prepare("INSERT INTO audit(actor,action,detail,created) VALUES ('root','config.update','share_notification_template updated','2024-01-03')").run()
;[['product', 'Nimbus'], ['share_notification_template', 'Hi {{ name }}, {{ sharer }} shared "{{ file }}" with you.']]
  .forEach(c => db.prepare('INSERT INTO config(key,value) VALUES (?,?)').run(c[0], c[1]))

module.exports = { db }
