// Deterministic PRNG so a whole generation is a pure function of a seed string — the seed can be
// exposed (default seed endpoint) and reused to replicate the exact machine state.
function xmur3(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19) }
  return function () { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0 }
}
function mulberry32(a) {
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function makeRng(seed) { const s = xmur3(String(seed)); return mulberry32(s()) }
function randomSeed() { return Math.random().toString(36).slice(2, 10) }
module.exports = { makeRng, randomSeed }
