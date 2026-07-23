const { db } = require('../db')
const { userFromReq } = require('../auth')

function requireAuth(req, res) { const u = userFromReq(req); if (!u) { res.status(401).json({ error: 'unauthorized' }); return null } return u }
function requireStaff(req, res) { const u = requireAuth(req, res); if (!u) return null; if (u.role !== 'staff' && u.role !== 'admin') { res.status(403).json({ error: 'agent access required' }); return null } return u }
function requireAdmin(req, res) { const u = requireAuth(req, res); if (!u) return null; if (u.role !== 'admin') { res.status(403).json({ error: 'admin access required' }); return null } return u }
const subscriber = (id) => db.prepare('SELECT * FROM subscribers WHERE id = ?').get(id)
const subByName = (u) => db.prepare('SELECT * FROM subscribers WHERE username = ? OR email = ? OR msisdn = ?').get(u, u, u)
const line = (id) => db.prepare('SELECT * FROM lines_ WHERE id = ?').get(id)

module.exports = { db, requireAuth, requireStaff, requireAdmin, subscriber, subByName, line }
