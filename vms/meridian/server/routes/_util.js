const { db } = require('../db')
const { verify, sessionFromReq, bearer } = require('../auth')

// Acting identity = login session cookie OR a bearer token (id/access). Claims
// are trusted (stateless) — so a stolen admin token (V1) or a forged token (V5)
// is honoured with its role.
function actor(req) {
  const s = sessionFromReq(req)
  if (s) return s
  const b = bearer(req)
  return b ? verify(b) : null
}
function requireUser(req, res) {
  const a = actor(req)
  if (!a) { res.status(401).json({ error: 'login required' }); return null }
  return a
}
function requireAdmin(req, res) {
  const a = requireUser(req, res); if (!a) return null
  if (a.role !== 'admin') { res.status(403).json({ error: 'admin only' }); return null }
  return a
}
const hasScope = (a, s) => String(a && a.scope || '').split(/\s+/).includes(s)
const user = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id)
const userByName = (u) => db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(u, u)
const client = (id) => db.prepare('SELECT * FROM clients WHERE client_id = ?').get(id)
const pubUser = (u) => u && ({ id: u.id, uuid: u.uuid, username: u.username, name: u.name, avatar_seed: u.avatar_seed, department: u.department })

module.exports = { db, actor, requireUser, requireAdmin, hasScope, user, userByName, client, pubUser }
