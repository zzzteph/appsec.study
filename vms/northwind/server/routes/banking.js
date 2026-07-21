// Banking core. Planted: V1 (IDOR read of any account/transactions/customer),
// V2 (transfer trusts from_account — not owned), V14 (transfer allows negative
// amount), V6 (transfer 2FA accepts any 6-digit code), V10 (transaction-search
// SQLi), V8 (statement download path traversal -> leaks config/app.secret), V9
// (statement IDOR).
const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { db, requireAuth, customer, account, adjust } = require('./_util')

router.get('/accounts', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,type,number,balance,currency,status FROM accounts WHERE customer_id = ?').all(u.id))
})
// V1 — IDOR: any account by id.
router.get('/accounts/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const a = account(req.params.id); if (!a) return res.status(404).json({ error: 'not found' })
  res.json(a)
})
router.get('/accounts/:id/transactions', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT kind,amount,balance_after,memo,counterparty,created FROM transactions WHERE account_id = ? ORDER BY id DESC').all(req.params.id))
})
// V1 — IDOR: any customer's PII.
router.get('/customers/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const c = customer(req.params.id); if (!c) return res.status(404).json({ error: 'not found' })
  res.json({ id: c.id, name: c.name, email: c.email, phone: c.phone, dob: c.dob, address: c.address, kyc_status: c.kyc_status, tier: c.tier, role: c.role })
})

// V2/V14/V6 — transfer: no ownership check on from_account, negative allowed,
// 2FA code not really validated.
router.post('/transfers', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const b = req.body || {}
  const from = account(b.from_account), to = account(b.to_account)
  const amount = Number(b.amount)
  const code = String(b.code || '')
  if (!from || !to) return res.status(400).json({ error: 'invalid account' })
  if (!isFinite(amount)) return res.status(400).json({ error: 'invalid amount' })
  if (!/^\d{6}$/.test(code)) return res.status(403).json({ error: '2FA code required' })   // V6
  const me = customer(u.id)
  if (amount > me.daily_limit) return res.status(403).json({ error: `exceeds daily limit of ${me.daily_limit}` }) // raisable via V7; negative bypasses (V14)
  adjust(from.id, 'debit', -amount, b.memo || 'Transfer', 'Transfer to ' + to.number)
  const bal = adjust(to.id, 'credit', amount, b.memo || 'Transfer', 'Transfer from ' + from.number)
  const tid = db.prepare("INSERT INTO transfers(from_account,to_account,amount,memo,status,created) VALUES (?,?,?,?, 'completed', datetime('now'))")
    .run(from.id, to.id, amount, String(b.memo || '').slice(0, 140)).lastInsertRowid
  res.json({ ok: true, transfer_id: tid, amount, to_balance: bal })
})

// V10 — transaction search SQLi (scoped to the user, but `q` is concatenated).
router.get('/transactions/search', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const q = req.query.q != null ? String(req.query.q) : ''
  const sql = `SELECT t.memo, t.amount, t.kind, t.created, t.counterparty
               FROM transactions t JOIN accounts a ON t.account_id = a.id
               WHERE a.customer_id = ${u.id} AND t.memo LIKE '%${q}%'`
  try { res.json(db.prepare(sql).all()) }
  catch (e) { res.status(400).json({ error: 'search failed', detail: e.message, sql }) }
})

// ---- statements --------------------------------------------------------------
router.get('/statements', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,account_id,period,filename,created FROM statements WHERE customer_id = ?').all(u.id))
})
// V8 — statement download: path joined without traversal protection.
const STMT = path.join(__dirname, '..', 'statements')
router.get('/statements/download', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const file = req.query.file
  if (!file) return res.json({ available: fs.readdirSync(STMT) })
  try { res.type('text/plain').send(fs.readFileSync(path.join(STMT, file), 'utf8')) }
  catch (e) { res.status(404).json({ error: 'statement not found', detail: e.message }) }
})
// V9 — statement IDOR: any statement record by id.
router.get('/statements/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const s = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id)
  if (!s) return res.status(404).json({ error: 'not found' })
  let content = ''
  try { content = fs.readFileSync(path.join(STMT, s.filename), 'utf8') } catch {}
  res.json({ ...s, content })
})

module.exports = router
