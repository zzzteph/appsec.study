const express = require('express')
const cors = require('cors')
const path = require('path')
const routes = require('./routes')

const app = express()
app.use(cors())
app.use(express.json({ limit: '256kb' }))
app.use('/api', routes)

app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

app.listen(80, () => console.log('latty-3 on :80'))
