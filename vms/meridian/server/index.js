const express = require('express')
const cors = require('cors')
const path = require('path')
const { ISS } = require('./auth')

const app = express()
app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.set('trust proxy', true)

// OIDC discovery at the well-known root path.
app.get('/.well-known/openid-configuration', (req, res) => res.json({
  issuer: ISS,
  authorization_endpoint: ISS + '/api/oauth/authorize',
  token_endpoint: ISS + '/api/oauth/token',
  userinfo_endpoint: ISS + '/api/oauth/userinfo',
  introspection_endpoint: ISS + '/api/oauth/introspect',
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'impersonation'],
  scopes_supported: ['openid', 'profile', 'email', 'admin'],
  id_token_signing_alg_values_supported: ['HS256', 'none'],
}))

app.use('/api', require('./routes/oauth'))
app.use('/api', require('./routes/idp'))
app.use('/api', require('./routes/admin'))
app.use(require('./routes/apps'))   // /api/catch + /apps/* RP backends

app.get('/api/version', (req, res) => res.json({ name: 'Meridian ID', product: 'SSO / OpenID Connect', version: '2.4.0', node: process.version }))
app.get('/healthz', (req, res) => res.json({ ok: true }))
app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }))

// SPA
app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

// Verbose error handler (leaks stack).
app.use((err, req, res, next) => res.status(500).json({ error: err.message, stack: (err.stack || '').split('\n').slice(0, 6) }))

app.listen(80, () => console.log('Meridian ID on :80'))
