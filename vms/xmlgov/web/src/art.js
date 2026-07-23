const uri = (svg) => 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
export function logo(size = 30) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
    <defs><linearGradient id="xg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f6ea5"/><stop offset="1" stop-color="#2dd4bf"/></linearGradient></defs>
    <rect x="2" y="2" width="36" height="36" rx="8" fill="url(#xg)"/>
    <text x="20" y="21" font-size="12" font-weight="800" fill="#fff" text-anchor="middle" dominant-baseline="central" font-family="ui-monospace, monospace">&lt;/&gt;</text>
  </svg>`
  return uri(svg)
}
