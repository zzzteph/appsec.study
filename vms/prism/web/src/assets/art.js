const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }
export function logo(size = 28) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="pr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#4f9bff"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="9" fill="url(#pr)"/>
    <rect x="11" y="22" width="4.5" height="7" rx="1" fill="#fff" opacity="0.7"/><rect x="17.5" y="17" width="4.5" height="12" rx="1" fill="#fff" opacity="0.85"/><rect x="24" y="12" width="4.5" height="17" rx="1" fill="#fff"/>
  </svg>`
  return uri(svg)
}
export function avatar(seed = 'u', size = 32) {
  const h = hash(String(seed)); const a = 250 + (h % 40), b = 210 + (h * 7 % 40)
  const letter = String(seed).replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="v${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${a},60%,60%)"/><stop offset="1" stop-color="hsl(${b},55%,52%)"/></linearGradient></defs>
    <rect width="40" height="40" rx="8" fill="url(#v${h})"/><text x="20" y="21" font-size="16" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI, sans-serif">${letter}</text>
  </svg>`
  return uri(svg)
}
