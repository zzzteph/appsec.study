const express = require('express')
const cors = require('cors')
const path = require('path')
require('./db')

const app = express()
app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.set('trust proxy', true)

app.use('/api', require('./routes'))
app.get('/api/version', (req, res) => res.json({ name: 'Trackr', product: 'Package Tracking', version: '2.0.0' }))
app.get('/healthz', (req, res) => res.json({ ok: true }))
app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }))

app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))
// Errors are swallowed to a generic message (no stack, no SQL) — this lab is
// intentionally blind, so nothing leaks through error responses.
app.use((err, req, res, next) => res.status(500).json({ error: 'server error' }))

app.listen(80, () => console.log('Blindspot (Trackr) on :80'))
