// Account & profile. Planted: V7 (mass-assignment privesc via PATCH /me — role,
// kyc_status, tier, daily_limit), V-CSRF (cookie-session email change), V5 (BOLA
// inbox read incl. reset links), V3 (BOLA payees / beneficiaries).
const express = require('express')
const router = express.Router()
const { db, requireAuth, customer } = require('./_util')
const { sidFromReq, verify } = require('../auth')

const meCard = (c) => ({
  id: c.id, uuid: c.uuid, username: c.username, email: c.email, name: c.name, role: c.role,
  phone: c.phone, dob: c.dob, address: c.address, kyc_status: c.kyc_status, tier: c.tier,
  daily_limit: c.daily_limit, twofa_enabled: c.twofa_enabled, avatar_seed: c.avatar_seed,
})

router.get('/me', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json(meCard(customer(u.id))) })

// V7 — mass assignment. The profile form only submits name/phone/address, but
// role, kyc_status, tier and daily_limit are honoured too.
const ALLOWED = ['name', 'phone', 'address', 'dob', 'role', 'kyc_status', 'tier', 'daily_limit']
router.patch('/me', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const sets = [], vals = []
  for (const k of Object.keys(req.body || {})) if (ALLOWED.includes(k)) { sets.push(`${k} = ?`); vals.push(req.body[k]) }
  if (sets.length) { vals.push(u.id); db.prepare(`UPDATE customers SET ${sets.join(', ')} WHERE id = ?`).run(...vals) }
  res.json(meCard(customer(u.id)))
})

// V-CSRF — email change identified only by the nw_sid cookie (no CSRF token).
router.post('/me/email', (req, res) => {
  const sid = sidFromReq(req); const d = sid ? verify(sid) : null
  if (!d || !d.id) return res.status(401).json({ error: 'no session' })
  const email = (req.body || {}).email
  if (!email) return res.status(400).json({ error: 'email required' })
  db.prepare('UPDATE customers SET email = ? WHERE id = ?').run(email, d.id)
  res.json({ ok: true, email })
})

// ---- inbox -------------------------------------------------------------------
router.get('/inbox', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,subject,body,is_system,read,created FROM messages WHERE customer_id = ? ORDER BY id DESC').all(u.id))
})
// V5 — BOLA: any message by global id (reset links included).
router.get('/inbox/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const m = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id)
  if (!m) return res.status(404).json({ error: 'not found' })
  res.json(m)
})

// ---- payees ------------------------------------------------------------------
router.get('/payees', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,name,account_number,bank FROM payees WHERE customer_id = ?').all(u.id))
})
router.post('/payees', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const { name, account_number, bank } = req.body || {}
  const id = db.prepare("INSERT INTO payees(customer_id,name,account_number,bank,created) VALUES (?,?,?,?,datetime('now'))")
    .run(u.id, String(name || '').slice(0, 60), String(account_number || '').slice(0, 30), String(bank || '').slice(0, 40)).lastInsertRowid
  res.json({ ok: true, id })
})
// V3 — BOLA: any customer's beneficiaries, no ownership check.
router.get('/customers/:id/payees', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,name,account_number,bank FROM payees WHERE customer_id = ?').all(req.params.id))
})

// ---- kyc (secured decoy) + support ------------------------------------------
router.get('/kyc/status', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json({ status: customer(u.id).kyc_status }) })
router.get('/tickets', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json(db.prepare('SELECT * FROM tickets WHERE customer_id = ? ORDER BY id DESC').all(u.id)) })
router.post('/tickets', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const id = db.prepare("INSERT INTO tickets(customer_id,subject,body,status,created) VALUES (?,?,?, 'open', datetime('now'))")
    .run(u.id, String((req.body || {}).subject || '').slice(0, 120), String((req.body || {}).body || '').slice(0, 2000)).lastInsertRowid
  res.json({ ok: true, id })
})
router.get('/faq', (req, res) => res.json([
  { q: 'How do I transfer money?', a: 'Go to Transfer, pick an account and a payee, and confirm.' },
  { q: 'How do I raise my daily limit?', a: 'Contact support — limit changes require review.' },
]))

module.exports = router
