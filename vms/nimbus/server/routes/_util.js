const { db } = require('../db')
const { userFromReq } = require('../auth')
function requireAuth(req, res) { const u = userFromReq(req); if (!u) { res.status(401).json({ error: 'unauthorized' }); return null } return u }
function requireAdmin(req, res) { const u = requireAuth(req, res); if (!u) return null; if (u.role !== 'admin') { res.status(403).json({ error: 'admin access required' }); return null } return u }
const user = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id)
const userByName = (u) => db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(u, u)
const file = (id) => db.prepare('SELECT * FROM files WHERE id = ?').get(id)
module.exports = { db, requireAuth, requireAdmin, user, userByName, file }
