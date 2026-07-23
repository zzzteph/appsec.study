// HelpDeskAI REST API. Ordinary support-app endpoints plus the two agent sinks:
//   POST /api/chat              — talk to the assistant (direct prompt injection)
//   POST /api/tickets/:id/triage — run the assistant over ticket text (indirect
//                                  prompt injection: the ticket body is data that
//                                  becomes instructions)
const express = require('express')
const router = express.Router()
const { db, md5 } = require('./db')
const { sign, userFromReq } = require('./auth')
const { runAgent } = require('./agent')

const userById = (id) => db.prepare('SELECT * FROM users WHERE id=?').get(id)
const pub = (u) => u && ({ id: u.id, username: u.username, role: u.role, name: u.name, email: u.email, address: u.address, plan: u.plan })
function auth(req, res) { const c = userFromReq(req); if (!c) { res.status(401).json({ error: 'login required' }); return null } return userById(c.id) }

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = db.prepare('SELECT * FROM users WHERE username=?').get(username || '')
  if (!u || !(u.hash_algo === 'md5' ? md5(password || '') === u.password : password === u.password)) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ token: sign(u), user: pub(u) })
})
router.get('/me', (req, res) => { const u = auth(req, res); if (!u) return; res.json(pub(u)) })

// ---- assistant ----
router.post('/chat', (req, res) => {
  const u = auth(req, res); if (!u) return
  const message = String((req.body || {}).message || '')
  if (!message.trim()) return res.status(400).json({ error: 'empty message' })
  res.json(runAgent(u, message))
})

// ---- knowledge base (web path is ACL'd: internal docs hidden here) ----
router.get('/kb', (req, res) => res.json(db.prepare('SELECT id,title,tags FROM kb WHERE internal=0 ORDER BY id').all()))
router.get('/kb/search', (req, res) => {
  const q = '%' + String(req.query.q || '') + '%'
  res.json(db.prepare('SELECT id,title,body,tags FROM kb WHERE internal=0 AND (title LIKE ? OR body LIKE ? OR tags LIKE ?) ORDER BY id').all(q, q, q))
})
router.get('/kb/:id', (req, res) => { const d = db.prepare('SELECT id,title,body,tags FROM kb WHERE id=? AND internal=0').get(req.params.id); if (!d) return res.status(404).json({ error: 'not found' }); res.json(d) })

// ---- orders / account (session-scoped, safe) ----
router.get('/orders', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT id,item,amount,status,card_last4,ship_to FROM orders WHERE user_id=?').all(u.id)) })
router.get('/account', (req, res) => { const u = auth(req, res); if (!u) return; res.json(pub(u)) })

// ---- tickets ----
router.get('/tickets', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT id,subject,status,created FROM tickets WHERE user_id=? ORDER BY id DESC').all(u.id)) })
router.post('/tickets', (req, res) => {
  const u = auth(req, res); if (!u) return
  const { subject, body } = req.body || {}
  const info = db.prepare("INSERT INTO tickets(user_id,subject,body,status,created) VALUES (?,?,?,?, date('now'))").run(u.id, String(subject || '').slice(0, 200), String(body || '').slice(0, 4000), 'open')
  res.json({ ok: true, id: info.lastInsertRowid })
})
router.get('/tickets/:id', (req, res) => {
  const u = auth(req, res); if (!u) return
  const t = db.prepare('SELECT * FROM tickets WHERE id=?').get(req.params.id)
  if (!t || t.user_id !== u.id) return res.status(404).json({ error: 'not found' })   // owner-checked (safe)
  res.json(t)
})
// indirect prompt injection: the assistant is run over the (attacker-authored) ticket body
router.post('/tickets/:id/triage', (req, res) => {
  const u = auth(req, res); if (!u) return
  const t = db.prepare('SELECT * FROM tickets WHERE id=?').get(req.params.id)
  if (!t || t.user_id !== u.id) return res.status(404).json({ error: 'not found' })
  const out = runAgent(u, `Please triage this support ticket and suggest next actions.\n\nSubject: ${t.subject}\nMessage: ${t.body}`)
  res.json(out)
})

module.exports = router
