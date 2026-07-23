// Auth: login/register/logout/refresh (+ V-enum, V-redir). Password check
// supports the legacy md5 admin (V9 crackable).
const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()
const { db, userByName, user } = require('./_util')
const { SECRET, sign, bcryptHash, bcryptCheck, md5 } = require('../auth')

function setSid(res, u) { res.setHeader('Set-Cookie', `nb_sid=${jwt.sign({ id: u.id, sid: true }, SECRET, { expiresIn: '7d' })}; Path=/; SameSite=Lax; Max-Age=604800`) }
const checkPw = (u, p) => u.hash_algo === 'md5' ? md5(p) === u.password : bcryptCheck(p, u.password)
const meCard = (u) => ({ id: u.id, uuid: u.uuid, username: u.username, email: u.email, name: u.name, role: u.role, quota_gb: u.quota_gb, used_mb: u.used_mb, avatar_seed: u.avatar_seed })

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = userByName(username || ''); if (!u) return res.status(401).json({ error: 'No account with that username' })  // V-enum
  if (!checkPw(u, password || '')) return res.status(401).json({ error: 'Incorrect password' })
  setSid(res, u); res.json({ access: sign(u), user: meCard(u) })
})
router.post('/register', (req, res) => {
  const { username, email, password, name } = req.body || {}
  if (!username || !email || !password) return res.status(400).json({ error: 'username, email, password required' })
  if (userByName(username)) return res.status(409).json({ error: 'username taken' })
  const id = (db.prepare('SELECT MAX(id) m FROM users').get().m || 0) + 1
  db.prepare("INSERT INTO users(id,uuid,username,email,password,hash_algo,role,name,avatar_seed,quota_gb,used_mb,created) VALUES (?,?,?,?,?, 'bcrypt','user',?,?,10,0,datetime('now'))")
    .run(id, 'usr_' + id, username, email, bcryptHash(password), name || username, username)
  db.prepare("INSERT INTO files(owner_id,folder_id,name,mime,size,content,is_folder,created) VALUES (?,0,'Welcome.txt','text/plain',0.2,'Welcome to Nimbus!',0,datetime('now'))").run(id)
  setSid(res, user(id)); res.json({ access: sign(user(id)), user: meCard(user(id)) })
})
router.post('/logout', (req, res) => { res.setHeader('Set-Cookie', 'nb_sid=; Path=/; Max-Age=0'); res.json({ ok: true }) })
router.post('/refresh', (req, res) => {
  const m = (req.headers.cookie || '').match(/nb_sid=([^;]+)/); if (!m) return res.status(401).json({ error: 'no session' })
  try { const d = jwt.verify(decodeURIComponent(m[1]), SECRET); res.json({ access: sign(user(d.id)), user: meCard(user(d.id)) }) } catch { res.status(401).json({ error: 'invalid session' }) }
})
router.get('/continue', (req, res) => res.redirect(req.query.next || '/'))  // V-redir
module.exports = router
