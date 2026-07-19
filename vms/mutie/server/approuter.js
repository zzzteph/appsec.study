// Builds the express router for a generation from the engine mutation + the block registry.
const express = require('express')
const { mountAll } = require('./registry')

function buildRouter(mut, auth) {
  const router = express.Router()
  const funcs = mountAll(router, mut, auth)
  return { router, funcs }
}
module.exports = { buildRouter }
