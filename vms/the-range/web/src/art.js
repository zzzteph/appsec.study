const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
export function logo(size = 30) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="tr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f9e86"/><stop offset="1" stop-color="#29c3a5"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="8" fill="#0d141b" stroke="url(#tr)" stroke-width="2"/>
    <circle cx="20" cy="20" r="9" fill="none" stroke="url(#tr)" stroke-width="2"/><circle cx="20" cy="20" r="4" fill="none" stroke="url(#tr)" stroke-width="2"/><circle cx="20" cy="20" r="1.5" fill="#f0a83a"/>
  </svg>`
  return uri(svg)
}
