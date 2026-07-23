// The origin server, bound to loopback and fronted by the edge (edge.js).
// Started with insecureHTTPParser so it honours Transfer-Encoding the way a
// real origin would even when the edge framed the request by Content-Length
// (this is what makes the CL.TE desync in edge.js observable — V4).
const express = require('express')
const http = require('http')
const path = require('path')
require('./db')

function startBackend(port) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))

  // V3 — front-end ACL bypass primitive: the origin honours a routing-override
  // header, so a path the edge would block can be reached behind an allowed one.
  app.use((req, res, next) => {
    const o = req.headers['x-original-url'] || req.headers['x-rewrite-url']
    if (o) req.url = String(o)
    next()
  })

  app.get('/api/version', (req, res) => res.json({ name: 'FrontDesk', tier: 'origin', version: '4.1.0', node: process.version }))
  app.use('/api', require('./routes'))
  app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }))
  app.use(express.static(path.join(__dirname, 'public')))
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))
  app.use((err, req, res, next) => res.status(500).json({ error: err.message }))

  const server = http.createServer({ insecureHTTPParser: true }, app)
  server.keepAliveTimeout = 60000
  server.listen(port, '127.0.0.1', () => console.log('origin on 127.0.0.1:' + port))
  return server
}
module.exports = { startBackend }
