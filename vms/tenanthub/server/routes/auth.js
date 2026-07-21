// Auth: login/register/logout/refresh (+ V-enum user enumeration, V-redir open
// redirect). Password check supports the legacy md5 accounts (V6 crackable).
const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()
const { db, userByName, user } = require('./_util')
const { SECRET, sign, bcryptHash, bcryptCheck, md5 } = require('../auth')

function setSid(res, u) { res.setHeader('Set-Cookie', `th_sid=${jwt.sign({ id: u.id, sid: true }, SECRET, { expiresIn: '7d' })}; Path=/; SameSite=Lax; Max-Age=604800`) }
const checkPw = (u, p) => u.hash_algo === 'md5' ? md5(p) === u.password : bcryptCheck(p, u.password)
const meCard = (u) => ({ id: u.id, uuid: u.uuid, username: u.username, email: u.email, name: u.name, platform_role: u.platform_role, avatar_seed: u.avatar_seed })

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = userByName(username || '')
  if (!u) return res.status(401).json({ error: 'No user with that username' })          // V-enum
  if (!checkPw(u, password || '')) return res.status(401).json({ error: 'Incorrect password' })
  setSid(res, u)
  res.json({ access: sign(u), user: meCard(u) })
})

router.post('/register', (req, res) => {
  const { username, email, password, name } = req.body || {}
  if (!username || !email || !password) return res.status(400).json({ error: 'username, email, password required' })
  if (userByName(username)) return res.status(409).json({ error: 'username taken' })
  const id = (db.prepare('SELECT MAX(id) m FROM users').get().m || 0) + 1
  db.prepare(`INSERT INTO users(id,uuid,username,email,password,hash_algo,name,avatar_seed,platform_role,created)
    VALUES (?,?,?,?,?, 'bcrypt',?,?, 'user', datetime('now'))`).run(id, 'usr_' + id, username, email, bcryptHash(password), name || username, username)
  // new users get a personal workspace
  const orgId = db.prepare("INSERT INTO orgs(name,slug,plan,created) VALUES (?,?, 'free', datetime('now'))").run((name || username) + "'s Workspace", 'ws-' + id).lastInsertRowid
  db.prepare("INSERT INTO memberships(org_id,user_id,role,created) VALUES (?,?, 'owner', datetime('now'))").run(orgId, id)
  setSid(res, user(id))
  res.json({ access: sign(user(id)), user: meCard(user(id)) })
})

router.post('/logout', (req, res) => { res.setHeader('Set-Cookie', 'th_sid=; Path=/; Max-Age=0'); res.json({ ok: true }) })
router.post('/refresh', (req, res) => {
  const m = (req.headers.cookie || '').match(/th_sid=([^;]+)/)
  if (!m) return res.status(401).json({ error: 'no session' })
  try { const d = jwt.verify(decodeURIComponent(m[1]), SECRET); res.json({ access: sign(user(d.id)), user: meCard(user(d.id)) }) }
  catch { res.status(401).json({ error: 'invalid session' }) }
})
router.get('/continue', (req, res) => res.redirect(req.query.next || '/'))   // V-redir

module.exports = router
