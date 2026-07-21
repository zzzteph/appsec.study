// Internal-only service bound to 127.0.0.1:9000 (never published). Demonstrates SSRF impact: the only
// way to reach it from outside is through the API's server-side URL fetch ("import logo").
const http = require('http')
const SECRET = 'INTERNAL-svc-key-4f19ab'
http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.url === '/secret' || req.url === '/') return res.end(JSON.stringify({ service: 'bytebites-internal', secret: SECRET, note: 'internal only — trusts the local network' }))
  res.statusCode = 404; res.end(JSON.stringify({ error: 'not found' }))
}).listen(9000, '127.0.0.1', () => console.log('internal svc on 127.0.0.1:9000'))
module.exports = { SECRET }
