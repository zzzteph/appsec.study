const express = require('express')
const cors = require('cors')
const path = require('path')
const { db } = require('./db')
require('./mailer').bind(db)

const app = express()
app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.set('trust proxy', true)

app.use('/api/auth', require('./routes/auth'))
app.use('/api', require('./routes/account'))
app.use('/api', require('./routes/banking'))
app.use('/api', require('./routes/staff'))

app.get('/api/version', (req, res) => res.json({ name: 'Northwind Bank', product: 'Online Banking', version: '5.2.0', node: process.version }))
app.get('/healthz', (req, res) => res.json({ ok: true }))
app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }))

app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))
app.use((err, req, res, next) => res.status(500).json({ error: err.message, stack: (err.stack || '').split('\n').slice(0, 6) }))

app.listen(80, () => console.log('Northwind Bank on :80'))
