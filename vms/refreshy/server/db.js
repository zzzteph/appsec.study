import Database from 'better-sqlite3';
import crypto from 'crypto';

export const sql = new Database(':memory:');
export const hash = (p) => crypto.createHash('sha256').update(String(p)).digest('hex');

sql.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT);
  CREATE TABLE posts (id INTEGER PRIMARY KEY AUTOINCREMENT, author_id INTEGER, author TEXT, title TEXT, body TEXT, created_at TEXT);
  CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER, author_id INTEGER, author TEXT, body TEXT);
  CREATE TABLE ratings (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER, user_id INTEGER, value INTEGER);
`);

const insU = sql.prepare('INSERT INTO users(username,password) VALUES(?,?)');
[['alice', 'alice'], ['bob', 'bob'], ['demo', 'demo'], ['carol', 'carol']].forEach(([u, p]) => insU.run(u, hash(p)));

const insP = sql.prepare('INSERT INTO posts(author_id,author,title,body,created_at) VALUES(?,?,?,?,?)');
insP.run(1, 'alice', 'Hello Refreshy', 'My first post on <b>Refreshy</b> — say hi!', new Date().toISOString());
insP.run(2, 'bob', 'Vue tips', 'Use <code>ref</code> for primitives and <code>reactive</code> for objects.', new Date().toISOString());
insP.run(3, 'demo', 'Welcome', 'This is the demo feed. Posts and comments render rich text.', new Date().toISOString());
insP.run(1, 'alice', 'Weekend plans', 'Hiking, then some GraphQL. What are you up to?', new Date().toISOString());

const insC = sql.prepare('INSERT INTO comments(post_id,author_id,author,body) VALUES(?,?,?,?)');
insC.run(1, 2, 'bob', 'Nice first post! 🎉');
insC.run(2, 3, 'demo', 'Great tips, thanks.');
