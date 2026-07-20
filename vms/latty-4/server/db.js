// latty-4 — in-memory tenants + projects. Each project carries an API key + scopes.
const users = [
  { username: 'demo', password: 'demo', tenant: 'acme' },
]

const projects = [
  { id: 1, tenant: 'acme',     owner: 'demo', name: 'Acme Website',     apiKey: 'ak_free_acme_2c1f9b',   scopes: ['read'] },
  { id: 2, tenant: 'globex',   owner: 'gx',   name: 'Globex Analytics', apiKey: 'gx_live_9d4b7a2e5f10',  scopes: ['read', 'reports'] },
  { id: 3, tenant: 'initech',  owner: 'it',   name: 'Initech Billing',  apiKey: 'it_live_5f8c1240',      scopes: ['read'] },
  { id: 4, tenant: 'umbrella', owner: 'um',   name: 'Umbrella Portal',  apiKey: 'um_live_1a2b3c4d',      scopes: ['read', 'reports'] },
]

module.exports = { users, projects }
