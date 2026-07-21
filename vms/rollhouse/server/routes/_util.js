// Shared helpers + auth guards. Guards trust the JWT claims (stateless API):
//  - after V9 (PATCH role in DB) a re-login mints a staff token
//  - V14 (forged token with leaked secret) is honoured because claims are trusted
const { db } = require('../db')
const { userFromReq } = require('../auth')

function requireAuth(req, res) {
  const u = userFromReq(req)
  if (!u) { res.status(401).json({ error: 'unauthorized' }); return null }
  return u
}
function requireStaff(req, res) {
  const u = requireAuth(req, res); if (!u) return null
  if (u.role !== 'staff' && u.role !== 'admin') { res.status(403).json({ error: 'staff access required' }); return null }
  return u
}
function requireAdmin(req, res) {
  const u = requireAuth(req, res); if (!u) return null
  if (u.role !== 'admin') { res.status(403).json({ error: 'admin access required' }); return null }
  return u
}

const player = (id) => db.prepare('SELECT * FROM players WHERE id = ?').get(id)
const playerByName = (u) => db.prepare('SELECT * FROM players WHERE username = ?').get(u)
const playerByEmail = (e) => db.prepare('SELECT * FROM players WHERE email = ?').get(e)

// Safe public projection (the "correct" way — used by the hardened endpoints).
function pub(p) {
  if (!p) return null
  return {
    id: p.id, uuid: p.uuid, username: p.username, display_name: p.display_name,
    avatar_seed: p.avatar_seed, bio: p.bio, vip_tier: p.vip_tier, country: p.country, created: p.created,
  }
}

// Ledger-backed balance mutation.
function adjust(id, kind, amount, ref) {
  const p = player(id)
  const nb = Math.round(((p.balance || 0) + amount) * 100) / 100
  db.prepare('UPDATE players SET balance = ? WHERE id = ?').run(nb, id)
  db.prepare(`INSERT INTO ledger(player_id,kind,amount,balance_after,ref,created)
              VALUES (?,?,?,?,?,datetime('now'))`).run(id, kind, amount, nb, ref)
  return nb
}

module.exports = { db, requireAuth, requireStaff, requireAdmin, player, playerByName, playerByEmail, pub, adjust }
