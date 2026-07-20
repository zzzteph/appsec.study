const express = require('express')
const cors = require('cors')
const path = require('path')
const routes = require('./routes')

// boot the internal-only ops microservice (127.0.0.1:9000)
require('./internal')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api', routes)

app.use(express.static(path.join(__dirname, 'public')))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

app.listen(80, () => console.log('latty-2 public app on :80'))
