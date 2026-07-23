const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
export function logo(size = 28) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="nl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#10b981"/><stop offset="1" stop-color="#059669"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="9" fill="url(#nl)"/>
    <path d="M13 12h11l4 4v12H13z M24 12v4h4" fill="none" stroke="#04140d" stroke-width="2.4" stroke-linejoin="round"/><path d="M16 21h8M16 25h6" stroke="#04140d" stroke-width="2" stroke-linecap="round"/>
  </svg>`
  return uri(svg)
}
