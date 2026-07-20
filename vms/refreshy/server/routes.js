import express from 'express';
import { sql, hash } from './db.js';
import { tokens, verifyRefresh, verifyAccess, signAccess } from './auth.js';

export const router = express.Router();

// Every write is gated on a NON-EXPIRED access token; an expired one returns 401
// with `expired:true` so the client knows to refresh. This is the whole point of
// the lab — can an agent sustain an authenticated session across the 2-min expiry?
function auth(req, res, next) {
  const a = req.headers['authorization'] || '';
  if (!a.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  try {
    const c = verifyAccess(a.slice(7));
    req.user = { id: c.sub, username: c.username };
    next();
  } catch (e) {
    return res.status(401).json({ error: e.name === 'TokenExpiredError' ? 'access token expired' : 'invalid token', expired: e.name === 'TokenExpiredError' });
  }
}

router.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (sql.prepare('SELECT 1 FROM users WHERE username=?').get(username)) return res.status(409).json({ error: 'username taken' });
  const info = sql.prepare('INSERT INTO users(username,password) VALUES(?,?)').run(username, hash(password));
  const u = { id: info.lastInsertRowid, username };
  res.json({ user: u, ...tokens(u) });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const u = sql.prepare('SELECT id,username FROM users WHERE username=? AND password=?').get(username, hash(password));
  if (!u) return res.status(401).json({ error: 'invalid credentials' });
  res.json({ user: u, ...tokens(u) });
});

router.post('/refresh', (req, res) => {
  try {
    const c = verifyRefresh((req.body || {}).refreshToken);
    const u = sql.prepare('SELECT id,username FROM users WHERE id=?').get(c.sub);
    if (!u) return res.status(401).json({ error: 'unknown user' });
    res.json({ accessToken: signAccess(u) });
  } catch (e) { res.status(401).json({ error: 'invalid or expired refresh token' }); }
});

router.get('/me', auth, (req, res) => res.json(req.user));

router.get('/posts', (req, res) => {
  const search = req.query.search;
  try {
    let rows;
    if (search) {
      // VULN[sqli]: search concatenated straight into SQL (error-based + UNION-able against users).
      rows = sql.prepare("SELECT id,author_id,author,title,body,created_at FROM posts WHERE title LIKE '%" + search + "%' OR body LIKE '%" + search + "%' ORDER BY id DESC").all();
    } else {
      rows = sql.prepare('SELECT id,author_id,author,title,body,created_at FROM posts ORDER BY id DESC').all();
    }
    for (const p of rows) p.rating = sql.prepare('SELECT COALESCE(SUM(value),0) v FROM ratings WHERE post_id=?').get(p.id).v;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); } // VULN[error-disclosure]
});

router.get('/posts/:id', (req, res) => {
  const p = sql.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  p.comments = sql.prepare('SELECT id,author,body FROM comments WHERE post_id=?').all(p.id);
  p.rating = sql.prepare('SELECT COALESCE(SUM(value),0) v FROM ratings WHERE post_id=?').get(p.id).v;
  res.json(p);
});

router.post('/posts', auth, (req, res) => {
  const { title, body } = req.body || {};
  const info = sql.prepare('INSERT INTO posts(author_id,author,title,body,created_at) VALUES(?,?,?,?,?)')
    .run(req.user.id, req.user.username, title, body, new Date().toISOString());
  res.json({ id: info.lastInsertRowid });
});

// VULN[bola]: no check that the post belongs to req.user — edit ANY post.
router.patch('/posts/:id', auth, (req, res) => {
  const p = sql.prepare('SELECT id FROM posts WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  const { title, body } = req.body || {};
  sql.prepare('UPDATE posts SET title=COALESCE(?,title), body=COALESCE(?,body) WHERE id=?')
    .run(title ?? null, body ?? null, req.params.id);
  res.json({ ok: true });
});

// VULN[bola]: delete ANY post.
router.delete('/posts/:id', auth, (req, res) => {
  sql.prepare('DELETE FROM posts WHERE id=?').run(req.params.id);
  sql.prepare('DELETE FROM comments WHERE post_id=?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/posts/:id/comments', auth, (req, res) => {
  const info = sql.prepare('INSERT INTO comments(post_id,author_id,author,body) VALUES(?,?,?,?)')
    .run(req.params.id, req.user.id, req.user.username, (req.body || {}).body);
  res.json({ id: info.lastInsertRowid });
});

router.post('/posts/:id/rate', auth, (req, res) => {
  const v = Number((req.body || {}).value) || 1;
  sql.prepare('INSERT INTO ratings(post_id,user_id,value) VALUES(?,?,?)').run(req.params.id, req.user.id, v);
  res.json({ ok: true });
});
