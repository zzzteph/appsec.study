const express = require('express')
const ejs = require('ejs')
const { users, projects } = require('./db')
const { sign, userFromReq } = require('./auth')

const router = express.Router()

function auth(req, res, next) {
  const u = userFromReq(req)
  if (!u) return res.status(401).json({ error: 'auth required' })
  req.user = u; next()
}

// gate the report builder behind an API key that carries the `reports` scope
function apiKey(scope) {
  return (req, res, next) => {
    const key = req.headers['x-api-key'] || ''
    const p = projects.find(x => x.apiKey === key)
    if (!p) return res.status(401).json({ error: 'invalid API key' })
    if (scope && !p.scopes.includes(scope)) return res.status(403).json({ error: 'key missing scope: ' + scope })
    req.project = p; next()
  }
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = users.find(x => x.username === username && x.password === password)
  if (!u) return res.status(401).json({ error: 'invalid credentials' })
  res.json({ token: sign(u), user: { username: u.username, tenant: u.tenant } })
})

router.get('/me', auth, (req, res) => res.json(req.user))

// own projects only — correctly scoped, so your own list won't show the powerful key
router.get('/projects', auth, (req, res) => {
  res.json(projects.filter(p => p.owner === req.user.username).map(p => ({ id: p.id, name: p.name, tenant: p.tenant })))
})

// VULN[idor]: fetch-by-id skips the ownership check and returns the full record — including the
// project's apiKey and scopes. Enumerate ids to find a key that carries the `reports` scope.
router.get('/projects/:id', auth, (req, res) => {
  const p = projects.find(x => x.id === Number(req.params.id))
  if (!p) return res.status(404).json({ error: 'not found' })
  res.json(p)
})

// Report builder — accepts an EJS template + data, keyed by an API key with the `reports` scope.
// VULN[rce]: EJS renders attacker-controlled templates, and EJS templates execute arbitrary JS:
//   <%= process.mainModule.require('child_process').execSync('id') %>
router.post('/reports/render', apiKey('reports'), (req, res) => {
  const { template, data } = req.body || {}
  try {
    const output = ejs.render(String(template == null ? '' : template), data && typeof data === 'object' ? data : {})
    res.json({ tenant: req.project.tenant, output })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

module.exports = router
