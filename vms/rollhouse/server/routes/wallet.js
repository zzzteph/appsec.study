// Cashier & wallet. Planted: V5 (deposit credits a client-controlled amount),
// V8 (withdraw gated on the mutable wager_met flag), V17 (any 6-digit 2FA code),
// V16 (statement download path traversal -> leaks config/app.secret for V14).
const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { db, requireAuth, player, adjust } = require('./_util')

router.get('/cashier/methods', (req, res) => res.json([
  { id: 'visa', label: 'Visa / Mastercard', min: 10, max: 5000, icon: 'card' },
  { id: 'crypto', label: 'Crypto (BTC/ETH/USDT)', min: 20, max: 100000, icon: 'crypto' },
  { id: 'paysafe', label: 'PaySafe Voucher', min: 10, max: 1000, icon: 'voucher' },
  { id: 'bank', label: 'Bank Transfer', min: 50, max: 50000, icon: 'bank' },
]))

router.get('/wallet', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = player(u.id)
  res.json({
    balance: p.balance, bonus_balance: p.bonus_balance, currency: 'RC',
    wager_met: p.wager_met, wager_required: p.wager_required, wager_progress: p.wager_progress,
    recent: db.prepare('SELECT kind,amount,balance_after,ref,created FROM ledger WHERE player_id = ? ORDER BY id DESC LIMIT 20').all(u.id),
  })
})

// V5 — the cashier trusts the client-submitted credited amount. The UI sends
// credit_amount == amount(+match), but the server credits whatever it is told and
// performs no signature/consistency check against what was actually "paid".
router.post('/cashier/deposit', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const b = req.body || {}
  const paid = Number(b.amount)
  const credited = b.credit_amount != null ? Number(b.credit_amount) : paid
  if (!isFinite(credited) || credited <= 0) return res.status(400).json({ error: 'invalid amount' })
  const bal = adjust(u.id, 'deposit', credited, 'dep_' + (b.method || 'card'))
  res.json({ ok: true, paid, credited, balance: bal })
})

// V8/V17 — withdrawal is gated only on wager_met (mutable via V9) and a 2FA code
// that is not really validated (any 6 digits pass, V17).
router.post('/cashier/withdraw', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = player(u.id)
  const amount = Number((req.body || {}).amount)
  const code = String((req.body || {}).code || '')
  const min = Number(db.prepare("SELECT value FROM config WHERE key='min_withdrawal'").get().value)
  if (!isFinite(amount) || amount < min) return res.status(400).json({ error: `minimum withdrawal is ${min} RC` })
  if (amount > p.balance) return res.status(400).json({ error: 'insufficient balance' })
  if (!p.wager_met) return res.status(403).json({ error: 'complete the wagering requirement before withdrawing' })
  if (!/^\d{6}$/.test(code)) return res.status(403).json({ error: '2FA code required' })
  const bal = adjust(u.id, 'withdraw', -amount, 'wd_' + Date.now())
  res.json({ ok: true, amount, balance: bal, status: 'processing' })
})

// V16 — statement download. Path is joined without traversal protection, so
// ?file=../config/app.secret (or ../auth.js) reads arbitrary server files.
const STATEMENTS = path.join(__dirname, '..', 'statements')
router.get('/cashier/statements', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const file = req.query.file
  if (!file) {
    return res.json({ available: fs.readdirSync(STATEMENTS) })
  }
  try {
    const data = fs.readFileSync(path.join(STATEMENTS, file), 'utf8')
    res.type('text/plain').send(data)
  } catch (e) {
    res.status(404).json({ error: 'statement not found', detail: e.message })
  }
})

module.exports = router
