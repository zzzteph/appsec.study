// RollHouse "Provably Fair" — client verifier. Shipped so players can verify (and
// recompute) any round themselves. The server seed is derived from public inputs
// and this same salt, so the scheme commits to nothing secret.
export const FAIR_SALT = 'rh-fair-v3-2024'

async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}
async function hmac256hex(key, msg) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg))
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// Derive the server seed for a given player + nonce (matches the backend).
export async function serverSeed(playerId, nonce) {
  return sha256hex(`${FAIR_SALT}:${playerId}:${nonce}`)
}
export async function roll(serverSeed, clientSeed, nonce) {
  const h = await hmac256hex(serverSeed, `${clientSeed}:${nonce}`)
  return parseInt(h.slice(0, 8), 16) / 0x100000000
}
export function crashPoint(r) {
  if (r < 0.01) return 1.0
  return Math.max(1, Math.floor(99 / (1 - r)) / 100)
}
