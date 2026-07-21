// Account & profile. Planted: V9 (mass-assignment privesc via PATCH /me),
// V18 (CSRF email change on the legacy cookie session), V3 (BOLA inbox read),
// V2 (BOLA KYC doc download), V-Ref (self/repeat referral farming).
const express = require('express')
const router = express.Router()
const { db, requireAuth, player } = require('./_util')
const { sidFromReq, verify } = require('../auth')

function meCard(p) {
  return {
    id: p.id, uuid: p.uuid, username: p.username, email: p.email, display_name: p.display_name,
    avatar_seed: p.avatar_seed, bio: p.bio, role: p.role, vip_tier: p.vip_tier, kyc_status: p.kyc_status,
    balance: p.balance, bonus_balance: p.bonus_balance, wager_met: p.wager_met,
    wager_required: p.wager_required, wager_progress: p.wager_progress, twofa_enabled: p.twofa_enabled,
    referral_code: p.referral_code, phone: p.phone, dob: p.dob, country: p.country,
  }
}

router.get('/me', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(meCard(player(u.id)))
})

// V9 — mass assignment. The settings UI only submits display_name/bio/avatar_seed,
// but the endpoint also honours role, vip_tier, kyc_status and wager_met. Setting
// role="staff" (then re-logging in) unlocks the staff console.
const PATCH_ALLOWED = ['display_name', 'bio', 'avatar_seed', 'country', 'vip_tier', 'kyc_status', 'role', 'wager_met']
router.patch('/me', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const sets = [], vals = []
  for (const k of Object.keys(req.body || {})) {
    if (PATCH_ALLOWED.includes(k)) { sets.push(`${k} = ?`); vals.push(req.body[k]) }
  }
  if (sets.length) { vals.push(u.id); db.prepare(`UPDATE players SET ${sets.join(', ')} WHERE id = ?`).run(...vals) }
  res.json(meCard(player(u.id)))
})

// V18 — CSRF. Identifies the user from the rh_sid COOKIE (no bearer, no CSRF
// token) and changes the account email with no re-auth -> cross-site takeover.
router.post('/me/email', (req, res) => {
  const sid = sidFromReq(req)
  const d = sid ? verify(sid) : null
  if (!d || !d.id) return res.status(401).json({ error: 'no session' })
  const email = (req.body || {}).email
  if (!email) return res.status(400).json({ error: 'email required' })
  db.prepare('UPDATE players SET email = ? WHERE id = ?').run(email, d.id)
  res.json({ ok: true, email })
})

// ---- secured decoys ----------------------------------------------------------
router.post('/me/avatar', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const seed = String((req.body || {}).avatar_seed || '').slice(0, 40)
  db.prepare('UPDATE players SET avatar_seed = ? WHERE id = ?').run(seed || u.username, u.id)
  res.json({ ok: true, avatar_seed: seed })
})
router.patch('/me/notifications', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json({ ok: true, prefs: req.body || {} })
})
router.get('/me/limits', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json({ daily_deposit: 1000, daily_loss: 500, session_minutes: 120 })
})
router.post('/me/limits', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json({ ok: true, limits: req.body || {} })
})

// ---- inbox -------------------------------------------------------------------
router.get('/inbox', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,subject,body,is_system,read,created FROM messages WHERE player_id = ? ORDER BY id DESC').all(u.id))
})
// V3 — BOLA: any message by global id, no ownership check (reset links included).
router.get('/inbox/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const m = db.prepare('SELECT * FROM messages WHERE id = ?').get(req.params.id)
  if (!m) return res.status(404).json({ error: 'not found' })
  res.json(m)
})

// ---- kyc ---------------------------------------------------------------------
router.get('/kyc/status', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = player(u.id)
  res.json({ status: p.kyc_status, docs: db.prepare('SELECT id,type,filename,status FROM kyc_docs WHERE player_id = ?').all(u.id) })
})
router.post('/kyc/upload', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const { type, filename, content } = req.body || {}
  if (!['id_front', 'id_back', 'selfie'].includes(type)) return res.status(400).json({ error: 'bad document type' })
  if (typeof content !== 'string' || !/^data:image\/(png|jpe?g);base64,/.test(content)) return res.status(400).json({ error: 'image files only' })
  if (content.length > 200000) return res.status(413).json({ error: 'file too large' })
  const id = db.prepare(`INSERT INTO kyc_docs(doc_uuid,player_id,type,filename,content,status,created)
    VALUES (?,?,?,?,?, 'pending', datetime('now'))`).run('kyc_' + Date.now(), u.id, type, String(filename || 'upload.png').slice(0, 80), content).lastInsertRowid
  db.prepare("UPDATE players SET kyc_status = 'pending' WHERE id = ? AND kyc_status = 'none'").run(u.id)
  res.json({ ok: true, id })
})
// V2 — BOLA: download any KYC document (PII images) by enumerable id.
router.get('/kyc/docs/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const d = db.prepare('SELECT * FROM kyc_docs WHERE id = ?').get(req.params.id)
  if (!d) return res.status(404).json({ error: 'not found' })
  res.json(d)
})

// ---- referral (V-Ref: no self/first-time/dedupe checks -> farmable) ----------
router.get('/referral/code', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = player(u.id)
  res.json({ code: p.referral_code, referred: db.prepare('SELECT referred_email,status,bonus FROM referrals WHERE referrer_id = ?').all(u.id) })
})
router.post('/referral/claim', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const code = String((req.body || {}).code || '')
  const owner = db.prepare('SELECT * FROM players WHERE referral_code = ?').get(code)
  if (!owner) return res.status(404).json({ error: 'invalid referral code' })
  // No check that owner !== claimer, no first-time check, no dedupe.
  const ob = db.prepare('SELECT balance FROM players WHERE id = ?').get(owner.id).balance + 10
  db.prepare('UPDATE players SET balance = ? WHERE id = ?').run(ob, owner.id)
  const cb = db.prepare('SELECT balance FROM players WHERE id = ?').get(u.id).balance + 5
  db.prepare('UPDATE players SET balance = ? WHERE id = ?').run(cb, u.id)
  db.prepare(`INSERT INTO referrals(referrer_id,referred_email,referred_id,bonus,status,created)
    VALUES (?,?,?,?, 'claimed', datetime('now'))`).run(owner.id, player(u.id).email, u.id, 10)
  res.json({ ok: true, credited: { referrer: 10, you: 5 }, balance: cb })
})

// ---- support -----------------------------------------------------------------
router.get('/tickets', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT * FROM tickets WHERE player_id = ? ORDER BY id DESC').all(u.id))
})
router.post('/tickets', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const { subject, body } = req.body || {}
  const id = db.prepare("INSERT INTO tickets(player_id,subject,body,status,created) VALUES (?,?,?, 'open', datetime('now'))")
    .run(u.id, String(subject || '').slice(0, 120), String(body || '').slice(0, 2000)).lastInsertRowid
  res.json({ ok: true, id })
})
router.get('/faq', (req, res) => res.json([
  { q: 'How do I deposit?', a: 'Go to the Cashier and choose a payment method.' },
  { q: 'When can I withdraw a bonus?', a: 'After you meet the wagering requirement on the bonus.' },
  { q: 'Is RollHouse provably fair?', a: 'Yes — every round can be verified from its server & client seed.' },
]))

module.exports = router
