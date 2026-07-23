const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }
export function logo(size = 30) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="nb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b9bf4"/><stop offset="1" stop-color="#22c9c9"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#nb)"/>
    <path d="M14 26a5 5 0 010-10 6.5 6.5 0 0112.4-1A4.5 4.5 0 0126 26z" fill="#fff" opacity="0.92"/>
  </svg>`
  return uri(svg)
}
export function avatar(seed = 'u', size = 34) {
  const h = hash(String(seed)); const a = 190 + (h % 40), b = 170 + (h * 7 % 40)
  const letter = String(seed).replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="v${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${a},60%,55%)"/><stop offset="1" stop-color="hsl(${b},55%,48%)"/></linearGradient></defs>
    <rect width="40" height="40" fill="url(#v${h})"/>
    <text x="20" y="21" font-size="17" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI, sans-serif">${letter}</text>
  </svg>`
  return uri(svg)
}
