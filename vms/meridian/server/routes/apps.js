// Relying-party (RP) backends + the in-app callback catcher. Planted: V7 (Docs
// identifies the user by the EMAIL claim, so an attacker who registered a
// Meridian account with the victim's email gets the victim's docs), V4 (the RP
// /verify accepts an alg:none id_token). /api/catch is the in-band oracle for
// stolen authorization codes (no external collaborator).
const express = require('express')
const router = express.Router()
const { db } = require('./_util')
const { verifyIdToken } = require('../auth')

// ---- in-app catcher (attacker-controlled endpoint, fully in-container) -------
router.all('/api/catch', (req, res) => {
  const data = req.method === 'GET' ? JSON.stringify(req.query) : JSON.stringify(req.body || {})
  if (req.method === 'GET' && Object.keys(req.query).length === 0) {
    return res.json(db.prepare('SELECT id,data,created FROM catch_log ORDER BY id DESC LIMIT 50').all())
  }
  db.prepare("INSERT INTO catch_log(data,created) VALUES (?,datetime('now'))").run(String(data).slice(0, 2000))
  res.json({ ok: true })
})

function docsFor(email) { return db.prepare('SELECT id,title,body,created FROM rp_docs WHERE owner_email = ?').all(email) }

// Legit RP flow: exchange the code, then the RP trusts the email claim (V7).
router.post('/apps/docs/exchange', (req, res) => {
  const code = (req.body || {}).code
  const row = db.prepare('SELECT * FROM codes WHERE code = ?').get(code || '')
  if (!row) return res.status(400).json({ error: 'invalid code' })
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id)
  res.json({ email: u.email, name: u.name, docs: docsFor(u.email) }) // keyed by email (V7)
})

// V4 — RP validates a supplied id_token with a lenient verify (accepts alg:none),
// then trusts its email claim: forge {alg:none, email:victim} -> victim's docs.
router.post('/apps/docs/verify', (req, res) => {
  const claims = verifyIdToken((req.body || {}).id_token || '')
  if (!claims || !claims.email) return res.status(401).json({ error: 'invalid id_token' })
  res.json({ email: claims.email, name: claims.name, docs: docsFor(claims.email) })
})

// ---- Shop RP (mostly decoy) --------------------------------------------------
router.get('/apps/shop/products', (req, res) => res.json(db.prepare('SELECT id,name,price FROM rp_products').all()))
router.post('/apps/shop/exchange', (req, res) => {
  const row = db.prepare('SELECT * FROM codes WHERE code = ?').get((req.body || {}).code || '')
  if (!row) return res.status(400).json({ error: 'invalid code' })
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id)
  res.json({ email: u.email, name: u.name, cart: [], orders: [] })
})

module.exports = router
