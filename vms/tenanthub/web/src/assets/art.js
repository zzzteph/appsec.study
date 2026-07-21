const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }

export function logo(size = 28) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b7cff"/><stop offset="1" stop-color="#a06bff"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="9" fill="url(#t)"/>
    <rect x="11" y="11" width="7.5" height="7.5" rx="2" fill="#fff"/><rect x="21.5" y="11" width="7.5" height="7.5" rx="2" fill="#fff" opacity="0.7"/>
    <rect x="11" y="21.5" width="7.5" height="7.5" rx="2" fill="#fff" opacity="0.7"/><rect x="21.5" y="21.5" width="7.5" height="7.5" rx="2" fill="#fff"/>
  </svg>`
  return uri(svg)
}
export function avatar(seed = 'u', size = 30) {
  const h = hash(String(seed)); const a = 220 + (h % 80), b = 260 + (h * 7 % 60)
  const letter = String(seed).replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="a${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${a},55%,58%)"/><stop offset="1" stop-color="hsl(${b},50%,50%)"/></linearGradient></defs>
    <rect width="40" height="40" rx="8" fill="url(#a${h})"/>
    <text x="20" y="21" font-size="16" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI, sans-serif">${letter}</text>
  </svg>`
  return uri(svg)
}
