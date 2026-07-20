// latty-1 — blog. Real SQLite so the search SQLi is genuine (UNION-dumpable).
const Database = require('better-sqlite3')
const db = new Database(':memory:')

db.exec(`
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT,          -- stored in CLEARTEXT (planted)
  role TEXT,
  email TEXT
);
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  title TEXT,
  author TEXT,
  body TEXT,
  created TEXT
);
`)

const users = [
  ['admin',  'Bl0g-Adm1n!2024', 'admin',  'admin@latty.local'],
  ['editor', 'hunter2',          'editor', 'editor@latty.local'],
  ['jdoe',   'password123',      'author', 'jdoe@latty.local'],
  ['msmith', 'letmein2023',      'author', 'msmith@latty.local'],
]
const insU = db.prepare('INSERT INTO users(username,password,role,email) VALUES (?,?,?,?)')
for (const u of users) insU.run(u)

const posts = [
  ['Welcome to the Latty blog', 'admin',  'This is where the team posts release notes and how-tos. Use the search box to find older posts.', '2024-01-04'],
  ['Shipping v2 of the API',     'editor', 'We rewrote the reporting pipeline. Invoices and reports are now generated from templates in the admin console.', '2024-02-11'],
  ['Field notes: caching',       'jdoe',   'A short writeup on the caching layer and how we invalidate it on publish.', '2024-03-02'],
  ['Weekend maintenance',        'msmith', 'The site will be briefly unavailable while we migrate the database. Search may return partial results.', '2024-03-20'],
  ['Templating in reports',      'editor', 'The report generator supports {{ placeholders }} pulled from the invoice data. Handy for finance.', '2024-04-15'],
]
const insP = db.prepare('INSERT INTO posts(title,author,body,created) VALUES (?,?,?,?)')
for (const p of posts) insP.run(p)

module.exports = { db }
