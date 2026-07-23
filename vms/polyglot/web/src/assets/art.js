const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }
export function logo(size = 28) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b7cfa"/><stop offset="1" stop-color="#2dd4bf"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="9" fill="url(#pg)"/>
    <text x="20" y="21" font-size="17" font-weight="800" fill="#04121f" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI, sans-serif">文A</text>
  </svg>`
  return uri(svg)
}
export function avatar(seed = 'u', size = 32) {
  const h = hash(String(seed)); const a = 200 + (h % 60), b = 160 + (h * 7 % 40)
  const letter = String(seed).replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="v${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${a},55%,58%)"/><stop offset="1" stop-color="hsl(${b},50%,50%)"/></linearGradient></defs>
    <rect width="40" height="40" rx="8" fill="url(#v${h})"/><text x="20" y="21" font-size="16" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI, sans-serif">${letter}</text>
  </svg>`
  return uri(svg)
}
