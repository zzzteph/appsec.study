// "Provably fair" engine — and the weakness (V12).
//
// A real provably-fair scheme commits to a SECRET server seed (only its hash is
// public before the bet). Here the server seed is DERIVED deterministically from
// public inputs (player id + nonce) and a fixed salt that also ships in the
// client bundle. So the pre-bet hash commits to nothing an attacker can't
// recompute: given your own player id and the current nonce you can calculate
// the exact server seed, hence the exact outcome, BEFORE placing the bet.
const crypto = require('crypto')

// Same constant is embedded in the SPA bundle (web/src/lib/fair.js) — "so
// players can verify results themselves".
const FAIR_SALT = 'rh-fair-v3-2024'

function serverSeed(playerId, nonce) {
  return crypto.createHash('sha256').update(`${FAIR_SALT}:${playerId}:${nonce}`).digest('hex')
}
function serverSeedHash(seed) {
  return crypto.createHash('sha256').update(seed).digest('hex')
}

// Outcome: HMAC(serverSeed, clientSeed:nonce) -> float in [0,1)
function roll(serverSeed, clientSeed, nonce) {
  const h = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex')
  return parseInt(h.slice(0, 8), 16) / 0x100000000
}

// Crash multiplier from a roll (house edge ~1%).
function crashPoint(r) {
  if (r < 0.01) return 1.0
  return Math.max(1.0, Math.floor((99 / (1 - r)) / 100 * 100) / 100)
}

module.exports = { FAIR_SALT, serverSeed, serverSeedHash, roll, crashPoint }
