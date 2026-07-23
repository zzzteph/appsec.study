const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
export function logo(size = 28) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="cw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="9" fill="url(#cw)"/>
    <circle cx="20" cy="20" r="5.5" fill="none" stroke="#04121a" stroke-width="2.4"/>
    <g stroke="#04121a" stroke-width="2.4" stroke-linecap="round"><path d="M20 9v3M20 28v3M9 20h3M28 20h3M12.2 12.2l2.1 2.1M25.7 25.7l2.1 2.1M27.8 12.2l-2.1 2.1M14.3 25.7l-2.1 2.1"/></g>
  </svg>`
  return uri(svg)
}
