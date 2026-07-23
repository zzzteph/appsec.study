const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
export function logo(size = 28) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="ec" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2fd07a"/><stop offset="1" stop-color="#16a34a"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="8" fill="#0e1411" stroke="url(#ec)" stroke-width="2"/>
    <circle cx="20" cy="20" r="7" fill="none" stroke="url(#ec)" stroke-width="2.5"/><circle cx="20" cy="20" r="2.4" fill="#2fd07a"/>
  </svg>`
  return uri(svg)
}
