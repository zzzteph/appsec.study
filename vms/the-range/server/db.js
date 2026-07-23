// Backing data for the injection challenges (real SQLite so C1/C2 are genuine).
const Database = require('better-sqlite3')
const { FLAGS } = require('./flags')
const db = new Database(':memory:')
db.pragma('journal_mode = memory')
db.exec(`
CREATE TABLE articles ( id INTEGER PRIMARY KEY, title TEXT, body TEXT );
CREATE TABLE secret ( id INTEGER PRIMARY KEY, flag TEXT );
CREATE TABLE tokens ( id INTEGER PRIMARY KEY, value TEXT );
`)
;[['Getting started', 'welcome'], ['Release notes', 'changelog'], ['Security policy', 'contact us']]
  .forEach(a => db.prepare('INSERT INTO articles(title,body) VALUES (?,?)').run(a[0], a[1]))
db.prepare('INSERT INTO secret(flag) VALUES (?)').run(FLAGS[1].flag)   // C1 UNION target
db.prepare('INSERT INTO tokens(value) VALUES (?)').run(FLAGS[2].flag)  // C2 blind target

// C3 IDOR documents (in-memory)
const documents = { 1: 'Public welcome document', 2: 'Team offsite notes', 1337: FLAGS[3].flag }
module.exports = { db, documents }
