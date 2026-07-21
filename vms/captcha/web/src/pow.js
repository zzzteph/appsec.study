// Browser proof-of-work — same FNV-1a as the server. Running this loop is the "I'm a real browser"
// proof; the checkbox click submits the found nonce so the click passes with no image challenge.
export function fnv1a(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h >>> 0
}
export function solvePow(salt, mask, cap = 5000000) {
  for (let nonce = 0; nonce < cap; nonce++) if ((fnv1a(salt + ':' + nonce) & mask) === 0) return nonce
  return null
}
