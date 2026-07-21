const express = require('express')
const cors = require('cors')
const path = require('path')
const { db } = require('./db')
const mailer = require('./mailer')
mailer.bind(db)

const app = express()
app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.set('trust proxy', true)

// API
app.use('/api/auth', require('./routes/auth'))
app.use('/api', require('./routes/account'))
app.use('/api', require('./routes/wallet'))
app.use('/api', require('./routes/games'))
app.use('/api', require('./routes/social'))
app.use('/api', require('./routes/staff'))

app.get('/api/version', (req, res) => res.json({
  name: 'RollHouse', version: '3.1.0', engine: 'express', node: process.version, build: '2024-05-31',
}))
app.get('/healthz', (req, res) => res.json({ ok: true }))
app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }))

// SPA
app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

// Verbose error handler (V20 — leaks stack traces to aid fingerprinting).
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: (err.stack || '').split('\n').slice(0, 6) })
})

app.listen(80, () => console.log('RollHouse on :80'))
