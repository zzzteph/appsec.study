const { db } = require('../db')
const { userFromReq } = require('../auth')

function requireAuth(req, res) {
  const u = userFromReq(req)
  if (!u) { res.status(401).json({ error: 'unauthorized' }); return null }
  return u
}
function requireSuperadmin(req, res) {
  const u = requireAuth(req, res); if (!u) return null
  if (u.platform_role !== 'superadmin') { res.status(403).json({ error: 'platform admin only' }); return null }
  return u
}
const user = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id)
const userByName = (u) => db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(u, u)
const org = (id) => db.prepare('SELECT * FROM orgs WHERE id = ?').get(id)
const project = (id) => db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
const ticket = (id) => db.prepare('SELECT * FROM tickets WHERE id = ?').get(id)
const orgRole = (userId, orgId) => (db.prepare('SELECT role FROM memberships WHERE user_id = ? AND org_id = ?').get(userId, orgId) || {}).role || null

// Correct tenancy check — used by the hardened (decoy) endpoints.
function requireOrgRole(req, res, orgId, roles) {
  const u = requireAuth(req, res); if (!u) return null
  const role = orgRole(u.id, orgId)
  if (!role || (roles && !roles.includes(role))) { res.status(403).json({ error: 'not a member of this workspace' }); return null }
  return u
}
// Automation/admin gate: project owner OR org admin|owner.
function canAdminProject(u, p) {
  return p && (p.owner_id === u.id || ['admin', 'owner'].includes(orgRole(u.id, p.org_id)))
}
const pubUser = (u) => u && ({ id: u.id, uuid: u.uuid, username: u.username, name: u.name, avatar_seed: u.avatar_seed })

module.exports = { db, requireAuth, requireSuperadmin, requireOrgRole, canAdminProject, user, userByName, org, project, ticket, orgRole, pubUser }
