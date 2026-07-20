const express = require('express')
const { db } = require('./db')
const { sign, userFromReq } = require('./auth')

const router = express.Router()

function auth(req, res, next) {
  const u = userFromReq(req)
  if (!u) return res.status(401).json({ error: 'auth required' })
  req.user = u; next()
}
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'admin only' })
  next()
}

// ---------- public blog ----------
router.get('/posts', (req, res) => {
  const rows = db.prepare('SELECT id,title,author,created,substr(body,1,120) AS snippet FROM posts ORDER BY id DESC').all()
  res.json(rows)
})

router.get('/posts/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id)
  if (!p) return res.status(404).json({ error: 'not found' })
  res.json(p)
})

// VULN[sqli]: query is string-concatenated. UNION-injectable, 3 columns (id,title,author).
//   e.g.  q = x' UNION SELECT id,username,password FROM users --
// dumps every user's CLEARTEXT password (including admin) in the "author" column.
router.get('/search', (req, res) => {
  const q = req.query.q || ''
  const sql = "SELECT id,title,author FROM posts WHERE title LIKE '%" + q + "%' OR body LIKE '%" + q + "%'"
  try {
    const rows = db.prepare(sql).all()
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message, sql }) // verbose: leaks the query, aids UNION tuning
  }
})

// ---------- auth ----------
router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!u || u.password !== password) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ token: sign(u), user: { username: u.username, role: u.role } })
})

router.get('/me', auth, (req, res) => res.json(req.user))

// ---------- admin: invoice / report generator ----------
// Naive {{ }} template renderer: each expression is evaluated as JavaScript with the
// invoice data in scope. Node globals (process) are reachable from that scope.
// VULN[rce]: SSTI → RCE, e.g.
//   template = "Total: {{ process.mainModule.require('child_process').execSync('id').toString() }}"
function render(tpl, ctx) {
  return String(tpl == null ? '' : tpl).replace(/\{\{([\s\S]+?)\}\}/g, (_, expr) => {
    try { return String(Function('ctx', 'with (ctx) { return (' + expr + ') }')(ctx)) }
    catch (e) { return '{{error: ' + e.message + '}}' }
  })
}

router.get('/reports/sample', auth, requireAdmin, (req, res) => {
  res.json({
    template: 'INVOICE #{{ number }}\nCustomer: {{ customer }}\nItems: {{ items }}\nSubtotal: {{ (amount).toFixed(2) }}\nTax: {{ (amount * 0.2).toFixed(2) }}\nTOTAL: {{ (amount * 1.2).toFixed(2) }}',
    data: { number: 'INV-1042', customer: 'Acme Corp', items: 3, amount: 250 }
  })
})

router.post('/reports/generate', auth, requireAdmin, (req, res) => {
  const { template, data } = req.body || {}
  const output = render(template, data && typeof data === 'object' ? data : {})
  res.json({ output })
})

module.exports = router
