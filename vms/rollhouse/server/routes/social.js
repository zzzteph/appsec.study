// Social & players. Planted: V1 (BOLA read of any player's PII/wallet/txns),
// V4 (tip trusts from_id and allows negative amounts -> drain anyone),
// V11 (stored + blind XSS via chat/feed, rendered in the staff moderation queue),
// plus /api/collect — the in-band blind-XSS catcher (no external collaborator).
const express = require('express')
const router = express.Router()
const { db, requireAuth, player, pub, adjust } = require('./_util')

// V1 — BOLA: full profile of ANY player id, no ownership check.
router.get('/players/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = player(req.params.id)
  if (!p) return res.status(404).json({ error: 'not found' })
  res.json({
    id: p.id, uuid: p.uuid, username: p.username, display_name: p.display_name, email: p.email,
    phone: p.phone, dob: p.dob, country: p.country, role: p.role, vip_tier: p.vip_tier,
    kyc_status: p.kyc_status, balance: p.balance, bonus_balance: p.bonus_balance,
    referral_code: p.referral_code, created: p.created,
  })
})
router.get('/players/:id/wallet', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = player(req.params.id)
  if (!p) return res.status(404).json({ error: 'not found' })
  res.json({ balance: p.balance, bonus_balance: p.bonus_balance, currency: 'RC' })
})
router.get('/players/:id/transactions', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT kind,amount,balance_after,ref,created FROM ledger WHERE player_id = ? ORDER BY id DESC').all(req.params.id))
})
// Secured contrast — public profile exposes only safe fields.
router.get('/players/:id/profile', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(pub(player(req.params.id)))
})
router.get('/leaderboard', (req, res) => {
  res.json(db.prepare(`SELECT display_name, vip_tier, country FROM players WHERE role = 'player' ORDER BY balance DESC LIMIT 10`).all())
})

// V4 — tip trusts from_id (no ownership check) and does not bound the amount
// (negative allowed) -> transfer funds out of any account.
router.post('/social/tip', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const from = Number((req.body || {}).from_id)
  const to = Number((req.body || {}).to_id)
  const amount = Number((req.body || {}).amount)
  const note = String((req.body || {}).note || '').slice(0, 120)
  if (!player(from) || !player(to) || !isFinite(amount)) return res.status(400).json({ error: 'from_id, to_id, amount required' })
  adjust(from, 'tip_out', -amount, 'tip_to_' + to)
  const bal = adjust(to, 'tip_in', amount, 'tip_from_' + from)
  db.prepare("INSERT INTO tips(from_id,to_id,amount,note,created) VALUES (?,?,?,?, datetime('now'))").run(from, to, amount, note)
  res.json({ ok: true, from, to, amount, to_balance: bal })
})

// ---- chat & feed (raw storage; rendered unsanitised in staff moderation) -----
router.get('/chat', (req, res) => res.json(db.prepare('SELECT id,username,message,created FROM chat ORDER BY id DESC LIMIT 50').all()))
router.post('/chat', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const message = String((req.body || {}).message || '').slice(0, 500)
  const id = db.prepare("INSERT INTO chat(player_id,username,message,created) VALUES (?,?,?, datetime('now'))").run(u.id, u.username, message).lastInsertRowid
  res.json({ ok: true, id })
})
router.get('/feed', (req, res) => res.json(db.prepare('SELECT id,username,game,amount,note,created FROM feed ORDER BY id DESC LIMIT 30').all()))
router.post('/feed', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const b = req.body || {}
  const id = db.prepare("INSERT INTO feed(player_id,username,game,amount,note,created) VALUES (?,?,?,?,?, datetime('now'))")
    .run(u.id, u.username, String(b.game || '').slice(0, 30), Number(b.amount) || 0, String(b.note || '').slice(0, 280)).lastInsertRowid
  res.json({ ok: true, id })
})
router.get('/friends', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare(`SELECT display_name, vip_tier, avatar_seed FROM players WHERE role='player' AND id != ? LIMIT 6`).all(u.id))
})

// ---- in-band blind-XSS catcher ----------------------------------------------
// A payload firing in the staff moderation queue can POST stolen data here; the
// attacker reads it back via GET. No external server involved.
router.all('/collect', (req, res) => {
  const data = req.method === 'GET'
    ? JSON.stringify(req.query)
    : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}))
  db.prepare("INSERT INTO collect(data,ip,created) VALUES (?,?, datetime('now'))").run(String(data).slice(0, 4000), req.ip || '')
  if (req.method === 'GET' && Object.keys(req.query).length === 0) {
    return res.json(db.prepare('SELECT id,data,ip,created FROM collect ORDER BY id DESC LIMIT 50').all())
  }
  res.json({ ok: true })
})

module.exports = router
