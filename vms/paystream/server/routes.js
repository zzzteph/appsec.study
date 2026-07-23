// Paystream routes. Planted: V1 (payslip IDOR), V2 (employee PII IDOR), V3
// (expense-approval workflow bypass), V4 (mass-assign salary/role), V5 (org-chart
// IDOR), V6 (employee-search SQLi), V7 (document download traversal), V8 (letter
// template SSTI -> RCE), V9 (JWT forge via leaked secret), V10 (expense memo blind
// XSS), V11 (bank-detail IDOR write), V-csrf/redir.
const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { db } = require('./db')
const { SECRET, sign, verify, userFromReq, sidFromReq, bcryptHash, bcryptCheck, md5 } = require('./auth')
const jwt = require('jsonwebtoken')
const { render } = require('./templates')

function auth(req, res) { const u = userFromReq(req); if (!u) { res.status(401).json({ error: 'unauthorized' }); return null } return u }
function admin(req, res) { const u = auth(req, res); if (!u) return null; if (u.role !== 'admin') { res.status(403).json({ error: 'admin only' }); return null } return u }
const emp = (id) => db.prepare('SELECT * FROM employees WHERE id = ?').get(id)
const meCard = (e) => ({ id: e.id, uuid: e.uuid, username: e.username, email: e.email, name: e.name, role: e.role, title: e.title, department: e.department, salary: e.salary, avatar_seed: e.avatar_seed })

// ---- auth --------------------------------------------------------------------
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  const e = db.prepare('SELECT * FROM employees WHERE username = ?').get(username || '')
  if (!e || !(e.hash_algo === 'md5' ? md5(password || '') === e.password : bcryptCheck(password || '', e.password))) return res.status(401).json({ error: 'invalid credentials' })
  res.setHeader('Set-Cookie', `ps_sid=${jwt.sign({ id: e.id, sid: true }, SECRET, { expiresIn: '7d' })}; Path=/; SameSite=Lax; Max-Age=604800`)
  res.json({ access: sign(e), user: meCard(e) })
})
router.get('/me', (req, res) => { const u = auth(req, res); if (!u) return; res.json(meCard(emp(u.id))) })
// V4 — mass assignment: role and salary honored.
router.patch('/me', (req, res) => {
  const u = auth(req, res); if (!u) return
  const A = ['name', 'address', 'role', 'salary', 'title']; const sets = [], vals = []
  for (const k of Object.keys(req.body || {})) if (A.includes(k)) { sets.push(`${k}=?`); vals.push(req.body[k]) }
  if (sets.length) { vals.push(u.id); db.prepare(`UPDATE employees SET ${sets.join(',')} WHERE id=?`).run(...vals) }
  res.json(meCard(emp(u.id)))
})
router.post('/me/email', (req, res) => {
  const d = sidFromReq(req) ? verify(sidFromReq(req)) : null
  if (!d || !d.id) return res.status(401).json({ error: 'no session' })
  db.prepare('UPDATE employees SET email=? WHERE id=?').run((req.body || {}).email || '', d.id); res.json({ ok: true })
})
router.get('/continue', (req, res) => res.redirect(req.query.next || '/'))  // V-redir

// ---- employees / directory ---------------------------------------------------
router.get('/employees', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT id,name,title,department FROM employees').all()) })
// V6 — employee-search SQLi (declared before /employees/:id so it isn't shadowed).
router.get('/employees/search', (req, res) => {
  const u = auth(req, res); if (!u) return
  const q = req.query.q != null ? String(req.query.q) : ''
  const sql = `SELECT id, name, title, department FROM employees WHERE name LIKE '%${q}%' OR title LIKE '%${q}%'`
  try { res.json(db.prepare(sql).all()) } catch (e) { res.status(400).json({ error: 'search failed', detail: e.message, sql }) }
})
// V2 — IDOR: any employee's full PII (salary, SSN, bank).
router.get('/employees/:id', (req, res) => {
  const u = auth(req, res); if (!u) return
  const e = emp(req.params.id); if (!e) return res.status(404).json({ error: 'not found' })
  res.json({ id: e.id, name: e.name, email: e.email, title: e.title, department: e.department, manager_id: e.manager_id, salary: e.salary, ssn: e.ssn, bank_account: e.bank_account, address: e.address, role: e.role })
})
// V5 — org-chart IDOR: any manager's direct reports (with salaries).
router.get('/employees/:id/reports', (req, res) => {
  const u = auth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,name,title,salary,ssn FROM employees WHERE manager_id = ?').all(req.params.id))
})
// V11 — bank-detail IDOR write: change any employee's payout bank.
router.post('/employees/:id/bank', (req, res) => {
  const u = auth(req, res); if (!u) return
  db.prepare('UPDATE employees SET bank_account = ? WHERE id = ?').run(String((req.body || {}).account || '').slice(0, 30), req.params.id)
  res.json({ ok: true, id: Number(req.params.id) })
})

// ---- payslips ----------------------------------------------------------------
router.get('/payslips', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT id,period,gross,tax,net FROM payslips WHERE employee_id=?').all(u.id)) })
// V1 — IDOR: any payslip.
router.get('/payslips/:id', (req, res) => { const u = auth(req, res); if (!u) return; const p = db.prepare('SELECT * FROM payslips WHERE id=?').get(req.params.id); if (!p) return res.status(404).json({ error: 'not found' }); res.json(p) })

// ---- expenses ----------------------------------------------------------------
router.get('/expenses', (req, res) => { const u = auth(req, res); if (!u) return; res.json(db.prepare('SELECT id,amount,category,memo,status FROM expenses WHERE employee_id=?').all(u.id)) })
router.post('/expenses', (req, res) => {
  const u = auth(req, res); if (!u) return
  const b = req.body || {}
  const id = db.prepare("INSERT INTO expenses(employee_id,amount,category,memo,status,approver_id,created) VALUES (?,?,?,?, 'pending', null, datetime('now'))").run(u.id, Number(b.amount) || 0, String(b.category || '').slice(0, 40), String(b.memo || '').slice(0, 500)).lastInsertRowid
  res.json({ ok: true, id })
})
// V3 — workflow bypass: approve any expense (incl. your own) — no manager/ownership check.
router.post('/expenses/:id/approve', (req, res) => {
  const u = auth(req, res); if (!u) return
  db.prepare("UPDATE expenses SET status='approved', approver_id=? WHERE id=?").run(u.id, req.params.id)
  res.json({ ok: true, id: Number(req.params.id), status: 'approved' })
})

// ---- documents ---------------------------------------------------------------
const DOCS = path.join(__dirname, 'documents')
router.get('/documents/download', (req, res) => {
  const u = auth(req, res); if (!u) return
  const file = req.query.file; if (!file) return res.json({ available: fs.readdirSync(DOCS) })
  try { res.type('text/plain').send(fs.readFileSync(path.join(DOCS, file), 'utf8')) } catch (e) { res.status(404).json({ error: 'not found', detail: e.message }) }
})

// ---- admin -------------------------------------------------------------------
router.get('/admin/overview', (req, res) => { const u = admin(req, res); if (!u) return; res.json({ employees: db.prepare('SELECT COUNT(*) c FROM employees').get().c, expenses_pending: db.prepare("SELECT COUNT(*) c FROM expenses WHERE status='pending'").get().c, payslips: db.prepare('SELECT COUNT(*) c FROM payslips').get().c }) })
router.get('/admin/employees', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,name,email,role,department,salary FROM employees').all()) })
router.get('/admin/expenses', (req, res) => { const u = admin(req, res); if (!u) return; res.json(db.prepare('SELECT id,employee_id,amount,category,memo,status FROM expenses ORDER BY id DESC').all()) })
router.get('/admin/config', (req, res) => { const u = admin(req, res); if (!u) return; res.json(Object.fromEntries(db.prepare('SELECT key,value FROM config').all().map(r => [r.key, r.value]))) })
// V8 — HR letter template rendered server-side (Nunjucks) -> SSTI RCE.
router.post('/admin/letter/preview', (req, res) => {
  const u = admin(req, res); if (!u) return
  const tpl = (req.body || {}).template != null ? String(req.body.template) : db.prepare("SELECT value FROM config WHERE key='letter_template'").get().value
  const ctx = (req.body || {}).sample || { name: 'Demo Employee', title: 'Analyst', salary: 75000 }
  try { res.json({ ok: true, rendered: render(tpl, ctx) }) } catch (e) { res.status(400).json({ error: 'render error', detail: e.message }) }
})
router.all('/collect', (req, res) => {
  const data = req.method === 'GET' ? JSON.stringify(req.query) : JSON.stringify(req.body || {})
  if (req.method === 'GET' && Object.keys(req.query).length === 0) return res.json(db.prepare('SELECT id,data,created FROM collect ORDER BY id DESC LIMIT 50').all())
  db.prepare("INSERT INTO collect(data,ip,created) VALUES (?,?,datetime('now'))").run(String(data).slice(0, 3000), req.ip || ''); res.json({ ok: true })
})

module.exports = router
