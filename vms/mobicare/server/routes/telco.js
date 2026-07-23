// Telco self-care. Planted: V2 (IDOR any line/subscriber/usage-CDR), V3 (SIM
// swap on a line you don't own), V14 (swap trusts a client `verified` flag), V8
// (bill IDOR), V7 (bill download path traversal -> config/app.secret), V9 (usage
// search SQLi).
const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const { db, requireAuth, subscriber, line } = require('./_util')

router.get('/lines', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json(db.prepare('SELECT * FROM lines_ WHERE subscriber_id = ?').all(u.id)) })
// V2 — IDOR: any line.
router.get('/lines/:id', (req, res) => { const u = requireAuth(req, res); if (!u) return; const l = line(req.params.id); if (!l) return res.status(404).json({ error: 'not found' }); res.json(l) })
// V2 — IDOR: any line's usage / call-detail records.
router.get('/lines/:id/usage', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json(db.prepare('SELECT type,counterparty,amount,unit,created FROM usage_ WHERE line_id = ? ORDER BY id DESC').all(req.params.id)) })
// V2 — IDOR: any subscriber's PII.
router.get('/subscribers/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const s = subscriber(req.params.id); if (!s) return res.status(404).json({ error: 'not found' })
  res.json({ id: s.id, name: s.name, msisdn: s.msisdn, email: s.email, address: s.address, dob: s.dob, plan: s.plan, tier: s.tier, kyc_status: s.kyc_status, role: s.role })
})

// V3/V14 — SIM swap: no ownership check on the line, and the "identity check" is
// a client-supplied `verified` flag. Swap any line to your SIM -> takeover.
router.post('/lines/:id/sim-swap', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const l = line(req.params.id); if (!l) return res.status(404).json({ error: 'line not found' })
  const b = req.body || {}
  if (b.verified !== true) return res.status(403).json({ error: 'identity verification required' })  // V14: client-trusted
  db.prepare("UPDATE lines_ SET sim_serial = ?, activated = datetime('now') WHERE id = ?").run(String(b.new_sim || '').slice(0, 40), l.id)  // V3: no ownership
  res.json({ ok: true, line_id: l.id, msisdn: l.msisdn, new_sim: b.new_sim, status: 'swapped' })
})

// ---- bills -------------------------------------------------------------------
const BILLS = path.join(__dirname, '..', 'bills')
router.get('/bills', (req, res) => { const u = requireAuth(req, res); if (!u) return; res.json(db.prepare('SELECT id,line_id,period,amount,status FROM bills WHERE subscriber_id = ?').all(u.id)) })
// V7 — bill download path traversal (declared before /bills/:id so it isn't shadowed).
router.get('/bills/download', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const file = req.query.file; if (!file) return res.json({ available: fs.readdirSync(BILLS) })
  try { res.type('text/plain').send(fs.readFileSync(path.join(BILLS, file), 'utf8')) } catch (e) { res.status(404).json({ error: 'bill not found', detail: e.message }) }
})
// V8 — IDOR: any bill.
router.get('/bills/:id', (req, res) => { const u = requireAuth(req, res); if (!u) return; const b = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id); if (!b) return res.status(404).json({ error: 'not found' }); res.json(b) })

// V9 — usage search SQLi.
router.get('/usage/search', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const q = req.query.q != null ? String(req.query.q) : ''
  const sql = `SELECT type, counterparty, amount, unit, created FROM usage_ WHERE subscriber_id = ${u.id} AND counterparty LIKE '%${q}%'`
  try { res.json(db.prepare(sql).all()) } catch (e) { res.status(400).json({ error: 'search failed', detail: e.message, sql }) }
})

// ---- plans (secured decoy) ---------------------------------------------------
router.get('/plans', (req, res) => res.json(db.prepare('SELECT id,name,price,data_gb,descr FROM plans').all()))
router.post('/plans/change', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const p = db.prepare('SELECT * FROM plans WHERE id = ?').get((req.body || {}).plan_id)
  if (!p) return res.status(400).json({ error: 'unknown plan' })
  db.prepare('UPDATE subscribers SET plan = ?, data_allowance_gb = ? WHERE id = ?').run(p.name, p.data_gb, u.id)  // server-priced, own account only
  res.json({ ok: true, plan: p.name })
})

module.exports = router
