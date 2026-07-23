const { startBackend } = require('./backend')
const { startEdge } = require('./edge')
const ORIGIN = 3000
startBackend(ORIGIN)
startEdge(80, ORIGIN)
console.log('FrontDesk up: edge :80 -> origin :' + ORIGIN)
