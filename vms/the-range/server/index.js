const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const { FLAGS } = require('./flags')
const { router: challenges, FLAGDIR } = require('./challenges')

// Materialise the file-read flags (C4 LFI, C6 cmd-injection, C7 XXE all read these).
const PUBDIR = path.join(__dirname, 'public_docs')
try { fs.mkdirSync(FLAGDIR, { recursive: true }); fs.mkdirSync(PUBDIR, { recursive: true }) } catch {}
fs.writeFileSync(path.join(FLAGDIR, 'c4.flag'), FLAGS[4].flag)
fs.writeFileSync(path.join(FLAGDIR, 'c6.flag'), FLAGS[6].flag)
fs.writeFileSync(path.join(FLAGDIR, 'c7.flag'), FLAGS[7].flag)
fs.writeFileSync(path.join(PUBDIR, 'readme.txt'), 'The Range — public documents. Nothing sensitive here.')

const app = express()
app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(express.text({ type: ['application/xml', 'text/xml'], limit: '1mb' }))
app.set('trust proxy', true)

app.use('/api', challenges)
app.use('/api', require('./score'))
app.get('/api/version', (req, res) => res.json({ name: 'The Range', product: 'Scanner Benchmark', challenges: Object.keys(FLAGS).length }))
app.get('/healthz', (req, res) => res.json({ ok: true }))
app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }))

app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))
app.use((err, req, res, next) => res.status(500).json({ error: err.message }))
app.listen(80, () => console.log('The Range on :80'))
