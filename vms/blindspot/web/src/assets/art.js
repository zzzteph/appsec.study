const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
export function logo(size = 30) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="tk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f59e0b"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#tk)"/>
    <path d="M11 15l9-4 9 4v10l-9 4-9-4z" fill="none" stroke="#1a1204" stroke-width="2.4" stroke-linejoin="round"/><path d="M11 15l9 4 9-4M20 19v10" stroke="#1a1204" stroke-width="2.4" fill="none" stroke-linejoin="round"/>
  </svg>`
  return uri(svg)
}
