// Account. Planted: V8 (mass-assignment via PATCH /me — role/quota), V-csrf
// (cookie-session email change).
const express = require('express')
const router = express.Router()
const { db, requireAuth, user } = require('./_util')
const { sidFromReq, verify } = require('../auth')
const meCard = (u) => ({ id: u.id, uuid: u.uuid, username: u.username, email: u.email, name: u.name, role: u.role, quota_gb: u.quota_gb, used_mb: u.used_mb, avatar_seed: u.avatar_seed })

router.get('/me', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json(meCard(user(u.id))) })
// V8 — mass assignment. UI submits name; endpoint also honors role and quota.
const ALLOWED = ['name', 'role', 'quota_gb']
router.patch('/me', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const sets = [], vals = []
  for (const k of Object.keys(req.body || {})) if (ALLOWED.includes(k)) { sets.push(`${k} = ?`); vals.push(req.body[k]) }
  if (sets.length) { vals.push(u.id); db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals) }
  res.json(meCard(user(u.id)))
})
// V-csrf — email change identified only by the nb_sid cookie.
router.post('/me/email', (req, res) => {
  const sid = sidFromReq(req); const d = sid ? verify(sid) : null
  if (!d || !d.id) return res.status(401).json({ error: 'no session' })
  const email = (req.body || {}).email; if (!email) return res.status(400).json({ error: 'email required' })
  db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, d.id); res.json({ ok: true, email })
})
module.exports = router
