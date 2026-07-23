// Polyglot data model + deterministic seed. Real SQLite so the string-search
// SQLi (V5) is UNION-dumpable. Translation VALUES are the SSTI/XSS vectors.
const Database = require('better-sqlite3')
const { bcryptHash, md5 } = require('./auth')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')

db.exec(`
CREATE TABLE users ( id INTEGER PRIMARY KEY, uuid TEXT, username TEXT UNIQUE, email TEXT, password TEXT, hash_algo TEXT, role TEXT, name TEXT, avatar_seed TEXT, created TEXT );
CREATE TABLE projects ( id INTEGER PRIMARY KEY, owner_id INTEGER, name TEXT, slug TEXT, visibility TEXT, source_lang TEXT, locale_file TEXT, description TEXT, created TEXT );
CREATE TABLE languages ( code TEXT PRIMARY KEY, name TEXT );
CREATE TABLE strings ( id INTEGER PRIMARY KEY, project_id INTEGER, key TEXT, source_text TEXT );
CREATE TABLE translations ( id INTEGER PRIMARY KEY, string_id INTEGER, project_id INTEGER, lang TEXT, value TEXT, translator_id INTEGER, created TEXT );
CREATE TABLE suggestions ( id INTEGER PRIMARY KEY, string_id INTEGER, author TEXT, body TEXT, created TEXT );
CREATE TABLE config ( key TEXT PRIMARY KEY, value TEXT );
CREATE TABLE collect ( id INTEGER PRIMARY KEY, data TEXT, ip TEXT, created TEXT );
CREATE TABLE staff_notes ( id INTEGER PRIMARY KEY, author TEXT, note TEXT, created TEXT );
`)

// users
;[
  ['demo', 'demo@polyglot.test', 'demo', 'bcrypt', 'contributor', 'Demo Translator'],
  ['maria', 'maria@acme.test', 'mariatrans', 'bcrypt', 'contributor', 'Maria Gomez'],
  ['hans', 'hans@acme.test', 'hanslang1', 'bcrypt', 'contributor', 'Hans Weber'],
  ['admin', 'admin@polyglot.test', 'monkey123', 'md5', 'admin', 'Site Admin'],
  ['root', 'ops@polyglot.test', 'P0lyGl0t#Ops', 'bcrypt', 'admin', 'Operations'],
].forEach((u, i) => { const id = i + 1; db.prepare('INSERT INTO users(id,uuid,username,email,password,hash_algo,role,name,avatar_seed,created) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id, 'usr_' + id, u[0], u[1], u[3] === 'md5' ? md5(u[2]) : bcryptHash(u[2]), u[3], u[4], u[5], u[0], '2023-01-01') })

// languages
;[['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['ja', 'Japanese']].forEach(l => db.prepare('INSERT INTO languages(code,name) VALUES (?,?)').run(l))

// projects (public + private confidential = IDOR targets)
;[
  [1, 'Public Website', 'website', 'public', 'en', 'website.en.json', 'Marketing site strings'],
  [2, 'Internal App — CONFIDENTIAL', 'internal', 'private', 'en', 'website.en.json', 'Unreleased internal product strings'],
  [3, 'Mobile App', 'mobile', 'private', 'en', 'website.en.json', 'iOS/Android app strings'],
].forEach(p => db.prepare('INSERT INTO projects(owner_id,name,slug,visibility,source_lang,locale_file,description,created) VALUES (?,?,?,?,?,?,?,?)').run(p[0], p[1], p[2], p[3], p[4], p[5], p[6], '2024-01-01'))

// strings
const S = [
  [1, 'home.title', 'Welcome to our website'], [1, 'home.subtitle', 'The best products, delivered fast'], [1, 'cta.signup', 'Sign up now'],
  [2, 'dash.title', 'Internal Dashboard'], [2, 'secret.flag', 'CONFIDENTIAL: launch date is 2024-09-01'],
  [3, 'app.welcome', 'Welcome to the app'],
]
S.forEach((s, i) => db.prepare('INSERT INTO strings(id,project_id,key,source_text) VALUES (?,?,?,?)').run(i + 1, s[0], s[1], s[2]))

// translations
;[
  [1, 1, 'es', 'Bienvenido a nuestro sitio web', 2], [1, 1, 'fr', 'Bienvenue sur notre site', 3],
  [2, 1, 'es', 'Los mejores productos, entregados rápido', 2], [4, 2, 'es', 'Panel interno', 2],
].forEach(t => db.prepare("INSERT INTO translations(string_id,project_id,lang,value,translator_id,created) VALUES (?,?,?,?,?, '2024-02-01')").run(t[0], t[1], t[2], t[3], t[4]))

db.prepare("INSERT INTO suggestions(string_id,author,body,created) VALUES (1,'maria','Consider a warmer tone here','2024-02-05')").run()
db.prepare("INSERT INTO staff_notes(author,note,created) VALUES ('root','Translation previews render server-side. Rotate config/app.secret before audit.','2024-01-02')").run()
;[['product', 'Polyglot'], ['email_template', 'Hi {{ name }}, {{ count }} strings need translation in {{ project }}.']]
  .forEach(c => db.prepare('INSERT INTO config(key,value) VALUES (?,?)').run(c[0], c[1]))

module.exports = { db }
