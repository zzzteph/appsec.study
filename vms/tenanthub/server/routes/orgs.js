// Orgs / members / invites / tokens. Planted: V1 (cross-tenant IDOR on org,
// members, invoices, invites), V5 (IDOR on API tokens), V4 (mass-assignment
// membership role — no check the requester is an admin), V3 (invite accept takes
// the role from the request and never invalidates the token).
const express = require('express')
const router = express.Router()
const { db, requireAuth, user, org } = require('./_util')

// My workspaces.
router.get('/orgs', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare(`SELECT o.id,o.name,o.slug,o.plan,m.role FROM orgs o JOIN memberships m ON m.org_id=o.id WHERE m.user_id=?`).all(u.id))
})
// V1 — IDOR: any org, no membership check.
router.get('/orgs/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const o = org(req.params.id); if (!o) return res.status(404).json({ error: 'not found' })
  res.json(o)
})
router.get('/orgs/:id/members', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare(`SELECT m.id,m.role,u.id user_id,u.name,u.email,u.username FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.org_id=?`).all(req.params.id))
})
router.get('/orgs/:id/invoices', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,amount,period,status FROM invoices WHERE org_id = ?').all(req.params.id))
})
// V5 — IDOR: any org's API tokens (secrets).
router.get('/orgs/:id/tokens', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,name,token,created FROM api_tokens WHERE org_id = ?').all(req.params.id))
})
// V1 — IDOR: any org's invites (tokens), which feeds V3.
router.get('/orgs/:id/invites', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  res.json(db.prepare('SELECT id,email,token,role,used FROM invites WHERE org_id = ?').all(req.params.id))
})

// V4 — mass-assignment: update a membership role with no check that the caller
// is an admin/owner of that org -> escalate your own membership.
router.patch('/memberships/:id', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const role = (req.body || {}).role
  if (!role) return res.status(400).json({ error: 'role required' })
  db.prepare('UPDATE memberships SET role = ? WHERE id = ?').run(role, req.params.id)
  const m = db.prepare('SELECT * FROM memberships WHERE id = ?').get(req.params.id)
  res.json({ ok: true, membership: m })
})

// V3 — invite accept trusts the role in the request body and never marks the
// invite used (replayable) -> join any org (whose invite token you found via the
// IDOR above) as owner/admin.
router.post('/invites/accept', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const { token, role } = req.body || {}
  const inv = db.prepare('SELECT * FROM invites WHERE token = ?').get(token || '')
  if (!inv) return res.status(404).json({ error: 'invalid invite' })
  const grant = role || inv.role
  db.prepare("INSERT INTO memberships(org_id,user_id,role,created) VALUES (?,?,?, datetime('now'))").run(inv.org_id, u.id, grant)
  res.json({ ok: true, org_id: inv.org_id, role: grant })
})

// Create an invite (hardened: requires you to be admin/owner of the org).
router.post('/orgs/:id/invites', (req, res) => {
  const u = requireAuth(req, res); if (!u) return
  const role = (db.prepare('SELECT role FROM memberships WHERE user_id=? AND org_id=?').get(u.id, req.params.id) || {}).role
  if (!['admin', 'owner'].includes(role)) return res.status(403).json({ error: 'admin required' })
  const token = require('crypto').randomBytes(12).toString('hex')
  db.prepare("INSERT INTO invites(org_id,email,token,role,used,created) VALUES (?,?,?,?,0, datetime('now'))").run(req.params.id, String((req.body || {}).email || ''), token, (req.body || {}).role || 'member')
  res.json({ ok: true, token })
})

module.exports = router
