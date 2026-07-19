// Free imagery: Lorem Picsum for photos (deterministic per seed, loaded by the browser), and
// self-contained SVG initial-avatars (data URIs, always render even offline).
export const photo = (seed, w = 400, h = 300) =>
  `https://picsum.photos/seed/${encodeURIComponent(String(seed))}/${w}/${h}`

const COLORS = ['#5c6bc0', '#26a69a', '#ec407a', '#ab47bc', '#ff7043', '#42a5f5', '#66bb6a', '#ffa726', '#8d6e63', '#78909c']
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) }

export function avatar(name) {
  name = String(name || '?')
  const parts = name.replace(/[._-]/g, ' ').trim().split(/\s+/)
  const initials = ((parts[0] || '?')[0] + (parts[1] ? parts[1][0] : '')).toUpperCase()
  const c = COLORS[hash(name) % COLORS.length]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' rx='40' fill='${c}'/><text x='50%' y='52%' dy='.35em' text-anchor='middle' font-family='Roboto,Arial,sans-serif' font-size='34' fill='#fff'>${initials}</text></svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}
