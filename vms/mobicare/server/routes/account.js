// Account. Planted: V4 (mass-assignment via PATCH /me — role/plan/tier/
// data_allowance_gb/kyc_status), V-csrf (cookie-session email change), V5 (BOLA
// inbox read incl. OTP codes + reset links).
const express = require('express')
const router = express.Router()
const { db, requireAuth, subscriber } = require('./_util')
const { sidFromReq, verify } = require('../auth')

const meCard = (s) => ({ id: s.id, uuid: s.uuid, username: s.username, msisdn: s.msisdn, email: s.email, name: s.name, role: s.role, plan: s.plan, tier: s.tier, data_allowance_gb: s.data_allowance_gb, kyc_status: s.kyc_status, twofa_enabled: s.twofa_enabled, address: s.address, avatar_seed: s.avatar_seed })

router.get('/me', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json(meCard(subscriber(u.id))) })

// V4 — mass assignment. UI submits name/address, endpoint also honors role, plan,
// tier, data_allowance_gb, kyc_status.
const ALLOWED = ['name', 'address', 'dob', 'role', 'plan', 'tier', 'data_allowance_gb', 'kyc_status']
router.patch('/me', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const sets = [], vals = []
  for (const k of Object.keys(req.body || {})) if (ALLOWED.includes(k)) { sets.push(`${k} = ?`); vals.push(req.body[k]) }
  if (sets.length) { vals.push(u.id); db.prepare(`UPDATE subscribers SET ${sets.join(', ')} WHERE id = ?`).run(...vals) }
  res.json(meCard(subscriber(u.id)))
})

// V-csrf — email change identified only by the mc_sid cookie (no CSRF token).
router.post('/me/email', (req, res) => {
  const sid = sidFromReq(req); const d = sid ? verify(sid) : null
  if (!d || !d.id) return res.status(401).json({ error: 'no session' })
  const email = (req.body || {}).email; if (!email) return res.status(400).json({ error: 'email required' })
  db.prepare('UPDATE subscribers SET email = ? WHERE id = ?').run(email, d.id)
  res.json({ ok: true, email })
})

router.get('/inbox', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json(db.prepare('SELECT id,subject,body,is_system,read,created FROM messages WHERE subscriber_id = ? ORDER BY id DESC').all(u.id)) })
// V5 — BOLA: any message by id (OTP codes + reset links).
router.get('/inbox/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const m = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id)
  if (!m) return res.status(404).json({ error: 'not found' })
  res.json(m)
})

router.get('/kyc/status', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json({ status: subscriber(u.id).kyc_status }) })
router.get('/tickets', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json(db.prepare('SELECT * FROM tickets WHERE subscriber_id = ? ORDER BY id DESC').all(u.id)) })
router.post('/tickets', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const id = db.prepare("INSERT INTO tickets(subscriber_id,subject,body,status,created) VALUES (?,?,?, 'open', datetime('now'))").run(u.id, String((req.body || {}).subject || '').slice(0, 120), String((req.body || {}).body || '').slice(0, 2000)).lastInsertRowid
  res.json({ ok: true, id })
})
router.get('/faq', (req, res) => res.json([
  { q: 'How do I top up data?', a: 'Go to Plans and choose a data add-on.' },
  { q: 'How do I swap my SIM?', a: 'Use My Line → Swap SIM and enter the new SIM serial.' },
]))

module.exports = router
