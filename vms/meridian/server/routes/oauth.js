// OAuth2 / OIDC endpoints. Planted: V1 (redirect_uri accepted if it merely
// starts with /apps/ -> code leaks to the in-app catcher), V6 (requested scope
// not checked against the client's allowed_scopes), V3 (auth code never
// invalidated + not bound to client_id -> replay/substitution), V9 (impersonation
// grant mints tokens for any sub), V4 (introspection accepts alg:none), V8
// (userinfo honours ?sub=).
const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const { db, requireUser, user, client } = require('./_util')
const { signIdToken, signAccess, verify, verifyIdToken, ISS } = require('../auth')

// V1 — loose redirect_uri validation.
function redirectAllowed(c, uri) {
  if (!uri) return false
  if ((c.redirect_uris || '').split(',').includes(uri)) return true
  return uri.startsWith('/apps/')            // any internal /apps/ path is accepted (flaw)
}

router.get('/oauth/authorize', (req, res) => {
  const a = requireUser(req, res); if (!a) return
  const { client_id, redirect_uri, scope = 'openid profile', state = '', prompt } = req.query
  const c = client(client_id)
  if (!c) return res.status(400).json({ error: 'unknown client_id' })
  if (!redirectAllowed(c, redirect_uri)) return res.status(400).json({ error: 'invalid redirect_uri' })
  if (prompt === 'consent') {
    return res.json({ consent_required: true, client: { client_id: c.client_id, name: c.name }, scope, redirect_uri, state })
  }
  // V6 — scope is passed straight through (allowed_scopes never consulted).
  const code = crypto.randomBytes(16).toString('hex')
  db.prepare(`INSERT INTO codes(code,client_id,user_id,redirect_uri,scope,state,used,created)
              VALUES (?,?,?,?,?,?,0,datetime('now'))`).run(code, client_id, Number(a.sub), redirect_uri, scope, state)
  const sep = redirect_uri.includes('?') ? '&' : '?'
  res.redirect(redirect_uri + sep + 'code=' + code + (state ? '&state=' + encodeURIComponent(state) : ''))
})

router.post('/oauth/authorize/decision', (req, res) => {
  const a = requireUser(req, res); if (!a) return
  const { client_id, redirect_uri, scope = 'openid profile', state = '', approve } = req.body || {}
  const c = client(client_id)
  if (!c || !redirectAllowed(c, redirect_uri)) return res.status(400).json({ error: 'invalid client/redirect' })
  if (!approve) return res.json({ redirect: redirect_uri + '?error=access_denied' })
  db.prepare("INSERT INTO consents(user_id,client_id,scope,created) VALUES (?,?,?,datetime('now'))").run(Number(a.sub), client_id, scope)
  const code = crypto.randomBytes(16).toString('hex')
  db.prepare(`INSERT INTO codes(code,client_id,user_id,redirect_uri,scope,state,used,created)
              VALUES (?,?,?,?,?,?,0,datetime('now'))`).run(code, client_id, Number(a.sub), redirect_uri, scope, state)
  const sep = redirect_uri.includes('?') ? '&' : '?'
  res.json({ redirect: redirect_uri + sep + 'code=' + code + (state ? '&state=' + encodeURIComponent(state) : '') })
})

router.post('/oauth/token', (req, res) => {
  const b = req.body || {}
  // V9 — impersonation grant: mint tokens for any sub with no authorization.
  if (b.grant_type === 'impersonation') {
    const u = user(b.sub)
    if (!u) return res.status(400).json({ error: 'unknown sub' })
    const scope = b.scope || 'openid profile email'
    const at = signAccess(u, b.client_id || 'console', scope)
    db.prepare("INSERT INTO tokens(access_token,user_id,client_id,scope,created) VALUES (?,?,?,?,datetime('now'))").run(at, u.id, b.client_id || 'console', scope)
    return res.json({ access_token: at, id_token: signIdToken(u, b.client_id || 'console', scope), token_type: 'Bearer', scope })
  }
  if (b.grant_type !== 'authorization_code') return res.status(400).json({ error: 'unsupported_grant_type' })
  // V3 — code looked up WITHOUT checking `used` (replayable) and WITHOUT binding
  // to client_id (a code minted for one client works at the token endpoint with
  // any client_id).
  const row = db.prepare('SELECT * FROM codes WHERE code = ?').get(b.code)
  if (!row) return res.status(400).json({ error: 'invalid_grant' })
  db.prepare('UPDATE codes SET used = 1 WHERE code = ?').run(b.code) // set but never enforced
  const u = user(row.user_id)
  const at = signAccess(u, b.client_id || row.client_id, row.scope)
  db.prepare("INSERT INTO tokens(access_token,user_id,client_id,scope,created) VALUES (?,?,?,?,datetime('now'))").run(at, u.id, row.client_id, row.scope)
  res.json({ access_token: at, id_token: signIdToken(u, row.client_id, row.scope), token_type: 'Bearer', scope: row.scope, expires_in: 3600 })
})

// V8 — userinfo honours ?sub= (returns any user's claims).
router.get('/oauth/userinfo', (req, res) => {
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/)
  const claims = m ? verify(m[1]) : null
  if (!claims) return res.status(401).json({ error: 'invalid_token' })
  const u = user(req.query.sub || claims.sub)
  if (!u) return res.status(404).json({ error: 'not found' })
  res.json({ sub: String(u.id), name: u.name, preferred_username: u.username, email: u.email, email_verified: !!u.email_verified, role: u.role, department: u.department })
})

// V4 — token introspection accepts alg:none id_tokens as valid.
router.post('/oauth/introspect', (req, res) => {
  const t = (req.body || {}).token
  const claims = verifyIdToken(t || '')
  if (!claims) return res.json({ active: false })
  res.json({ active: true, ...claims })
})

module.exports = router
