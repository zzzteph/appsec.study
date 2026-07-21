const { db } = require('../db')
const { userFromReq } = require('../auth')

function requireAuth(req, res) {
  const u = userFromReq(req)
  if (!u) { res.status(401).json({ error: 'unauthorized' }); return null }
  return u
}
function requireStaff(req, res) {
  const u = requireAuth(req, res); if (!u) return null
  if (u.role !== 'staff' && u.role !== 'admin') { res.status(403).json({ error: 'staff access required' }); return null }
  return u
}
function requireAdmin(req, res) {
  const u = requireAuth(req, res); if (!u) return null
  if (u.role !== 'admin') { res.status(403).json({ error: 'admin access required' }); return null }
  return u
}
const customer = (id) => db.prepare('SELECT * FROM customers WHERE id = ?').get(id)
const customerByName = (u) => db.prepare('SELECT * FROM customers WHERE username = ? OR email = ?').get(u, u)
const account = (id) => db.prepare('SELECT * FROM accounts WHERE id = ?').get(id)

// Ledger-backed balance mutation.
function adjust(accountId, kind, amount, memo, counterparty) {
  const a = account(accountId)
  const nb = Math.round(((a.balance || 0) + amount) * 100) / 100
  db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(nb, accountId)
  db.prepare(`INSERT INTO transactions(account_id,kind,amount,balance_after,memo,counterparty,created)
    VALUES (?,?,?,?,?,?,datetime('now'))`).run(accountId, kind, amount, nb, memo || '', counterparty || '')
  return nb
}
const pubCustomer = (c) => c && ({ id: c.id, uuid: c.uuid, name: c.name, tier: c.tier, avatar_seed: c.avatar_seed })

module.exports = { db, requireAuth, requireStaff, requireAdmin, customer, customerByName, account, adjust, pubCustomer }
