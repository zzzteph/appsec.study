// Pluggable auth model for a generation: jwt | session | apikey. The mutation's placements decide
// which auth-weaknesses are live (alg:none, weak-secret, predictable-sid, session-file, apikey-leak).
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const { APP_SECRET } = require('./secrets')
const { db } = require('./db')

const WEAK_SECRET = 'secret'                        // dictionary-crackable (jwt-weak-secret)
const SESS_FILE = path.join(__dirname, 'sessions.json')

function makeAuth(mut) {
  const model = mut.auth
  const on = (prim) => mut.placements.some(p => p.prim === prim)
  const sessions = new Map()                        // sid -> username
  const usersByKey = new Map()
  for (const u of db.prepare('SELECT username,apikey FROM users').all()) usersByKey.set(u.apikey, u.username)
  let seq = 1000

  const userByName = (n) => db.prepare('SELECT id,username,role,email,apikey FROM users WHERE username=?').get(n)

  function persist() { if (on('session-file')) { try { fs.writeFileSync(SESS_FILE, JSON.stringify([...sessions.entries()], null, 1)) } catch {} } }

  // seed an admin session so the predictable-sid / session-file paths are solo-testable
  function seedAdmin() {
    if (model !== 'session') return
    const sid = on('session-predict') ? 's-1000' : 's-adm-' + crypto.randomBytes(8).toString('hex')
    sessions.set(sid, mut && require('./secrets').ADMIN_USER || 'root_admin'); persist()
  }

  function newSid() { return on('session-predict') ? ('s-' + (++seq)) : ('s-' + crypto.randomBytes(16).toString('hex')) }

  // issue a credential for a freshly-authenticated user (per model)
  function issue(res, user) {
    if (model === 'jwt') return { token: jwt.sign({ username: user.username, role: user.role }, APP_SECRET, { expiresIn: '4h' }) }
    if (model === 'session') { const sid = newSid(); sessions.set(sid, user.username); persist(); res.setHeader('Set-Cookie', 'maze_sid=' + sid + '; Path=/; HttpOnly'); return { ok: true } }
    return { apiKey: user.apikey }                  // apikey model
  }

  // resolve the caller -> user record (or null). Honors the live auth-weaknesses.
  function resolve(req) {
    if (model === 'jwt') {
      const m = (req.headers.authorization || '').match(/^Bearer (.+)$/); if (!m) return null
      const tok = m[1]
      try { return userByName(jwt.verify(tok, APP_SECRET).username) } catch {}
      if (on('jwt-algnone')) { try { const d = jwt.decode(tok, { complete: true }); if (d && d.header && d.header.alg === 'none') return { username: d.payload.username, role: d.payload.role } } catch {} }
      if (on('jwt-weak-secret')) { try { return userByName(jwt.verify(tok, WEAK_SECRET).username) || { username: jwt.verify(tok, WEAK_SECRET).username, role: jwt.verify(tok, WEAK_SECRET).role } } catch {} }
      return null
    }
    if (model === 'session') {
      const c = (req.headers.cookie || '').match(/maze_sid=([^;]+)/)
      if (c) { const un = sessions.get(c[1]); if (un) return userByName(un) }
      // "remember me" cookie — an alternate credential path that resolves straight to a named user
      if (on('remember-me')) {
        const rc = (req.headers.cookie || '').match(/maze_remember=([^;]+)/)
        if (rc) {
          const v = mut.placements.find(p => p.prim === 'remember-me')
          const variant = v && v.variant
          let un = null
          try { un = variant === 'base64-username' ? Buffer.from(rc[1], 'base64').toString('utf8') : rc[1] } catch { un = null }
          if (un) return userByName(un)
        }
      }
      return null
    }
    // apikey — resolve from the DB so freshly-registered users' keys work too
    const k = req.headers['x-api-key']; if (!k) return null
    const u = db.prepare('SELECT username FROM users WHERE apikey=?').get(k)
    return u ? userByName(u.username) : null
  }

  seedAdmin()
  return { model, on, resolve, issue, sessions, WEAK_SECRET, SESS_FILE, ADMIN_KEYFN: () => (userByName(require('./secrets').ADMIN_USER) || {}).apikey }
}

module.exports = { makeAuth, WEAK_SECRET, SESS_FILE }
