// All imagery is generated inline as SVG data-URIs — no external image files, no
// network fetch. (A few real raster photos can be dropped into web/public/ later
// and referenced by URL; the SVG art already gives the "real product" look.)

const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }

// Per-game tile palette + glyph.
const TILE = {
  crash: [['#ff2e97', '#7a5cff'], '📈'], slots: [['#ffd45e', '#ff5c3e'], '🎰'],
  roulette: [['#34e5a3', '#0e7cff'], '🎡'], blackjack: [['#1e1e3a', '#4a2fb0'], '🃏'],
  plinko: [['#ff9d3e', '#ff2e97'], '🔻'], mines: [['#ff5c7a', '#7a1450'], '💣'],
  wheel: [['#7a5cff', '#ff2e97'], '🎯'], dice: [['#0e7cff', '#34e5a3'], '🎲'],
  baccarat: [['#b9992a', '#3a1a10'], '♠'], poker: [['#2f8f4a', '#0c3a1e'], '♣'],
  keno: [['#7a5cff', '#0e7cff'], '🔢'], hilo: [['#ff2e97', '#ffd45e'], '🔺'],
  sicbo: [['#ff5c3e', '#7a1450'], '🀄'], scratch: [['#ffd45e', '#ff2e97'], '✨'],
  bingo: [['#34e5a3', '#7a5cff'], '🅱'], tiger: [['#ff9d3e', '#c0392b'], '🐯'],
}

export function tile(key) {
  const [[c1, c2], glyph] = TILE[key] || [['#7a5cff', '#ff2e97'], '🎲']
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320" viewBox="0 0 240 320">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
      <radialGradient id="h" cx="50%" cy="30%" r="70%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>
    <rect width="240" height="320" rx="18" fill="url(#g)"/>
    <rect width="240" height="320" rx="18" fill="url(#h)"/>
    <circle cx="120" cy="130" r="66" fill="#000000" opacity="0.16"/>
    <text x="120" y="130" font-size="86" text-anchor="middle" dominant-baseline="central">${glyph}</text>
    <circle cx="34" cy="286" r="4" fill="#fff" opacity="0.5"/><circle cx="210" cy="40" r="3" fill="#fff" opacity="0.5"/>
  </svg>`
  return uri(svg)
}

export function logo(size = 34) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff2e97"/><stop offset="1" stop-color="#7a5cff"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#l)"/>
    <circle cx="14" cy="14" r="3.2" fill="#fff"/><circle cx="26" cy="14" r="3.2" fill="#fff"/>
    <circle cx="20" cy="20" r="3.2" fill="#fff"/><circle cx="14" cy="26" r="3.2" fill="#fff"/><circle cx="26" cy="26" r="3.2" fill="#fff"/>
  </svg>`
  return uri(svg)
}

export function avatar(seed = 'p', size = 40) {
  const h = hash(String(seed))
  const a = h % 360, b = (h * 7) % 360
  const letter = String(seed).replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="a${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${a},80%,60%)"/><stop offset="1" stop-color="hsl(${b},75%,50%)"/></linearGradient></defs>
    <rect width="40" height="40" fill="url(#a${h})"/>
    <text x="20" y="21" font-size="18" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI, sans-serif">${letter}</text>
  </svg>`
  return uri(svg)
}

export function heroArt() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
    <g opacity="0.9">
      <circle cx="230" cy="70" r="60" fill="#ffd45e" opacity="0.25"/>
      <text x="150" y="120" font-size="130" text-anchor="middle" dominant-baseline="central">🎰</text>
      <text x="255" y="60" font-size="52" text-anchor="middle">🎲</text>
      <text x="60" y="180" font-size="46" text-anchor="middle">🪙</text>
    </g></svg>`
  return uri(svg)
}
