// Inline SVG art (data-URIs) — no external images.
const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }

export function logo(size = 30) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f6bff"/><stop offset="1" stop-color="#22c9b7"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#m)"/>
    <path d="M11 28V13l9 8 9-8v15" fill="none" stroke="#0b1020" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`
  return uri(svg)
}

const ICONS = {
  docs: ['#4f6bff', '#7c8cff', 'M13 10h11l4 4v16H13z M24 10v4h4'],
  shop: ['#22c9b7', '#4f6bff', 'M12 13h20l-2 12H14z M16 30a1 1 0 100 2 1 1 0 000-2 M28 30a1 1 0 100 2 1 1 0 000-2'],
  console: ['#f87171', '#fbbf24', 'M20 9l10 4v7c0 6-4 9-10 11-6-2-10-5-10-11v-7z'],
  app: ['#7c8cff', '#22c9b7', 'M12 12h7v7h-7z M21 12h7v7h-7z M12 21h7v7h-7z M21 21h7v7h-7z'],
}
export function appIcon(kind, size = 44) {
  const [c1, c2, path] = ICONS[kind] || ICONS.app
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="i${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="40" height="40" rx="10" fill="url(#i${kind})" opacity="0.18"/>
    <path d="${path}" fill="none" stroke="${c1}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`
  return uri(svg)
}

export function avatar(seed = 'u', size = 36) {
  const h = hash(String(seed)); const a = h % 360, b = (h * 7) % 360
  const letter = String(seed).replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="v${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${a},60%,55%)"/><stop offset="1" stop-color="hsl(${b},55%,48%)"/></linearGradient></defs>
    <rect width="40" height="40" fill="url(#v${h})"/>
    <text x="20" y="21" font-size="17" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI, sans-serif">${letter}</text>
  </svg>`
  return uri(svg)
}
