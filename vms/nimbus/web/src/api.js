const API = '/api'
export const token = () => localStorage.getItem('nb_tok')
export const currentUser = () => { try { return JSON.parse(localStorage.getItem('nb_user')) } catch { return null } }
export function setAuth(a, u) { if (a) localStorage.setItem('nb_tok', a); if (u) localStorage.setItem('nb_user', JSON.stringify(u)) }
export function clearAuth() { localStorage.removeItem('nb_tok'); localStorage.removeItem('nb_user') }
async function req(method, path, body) {
  const h = {}; if (body !== undefined) h['Content-Type'] = 'application/json'
  const t = token(); if (t) h['Authorization'] = 'Bearer ' + t
  const r = await fetch(API + path, { method, headers: h, credentials: 'include', body: body !== undefined ? JSON.stringify(body) : undefined })
  const txt = await r.text(); let d; try { d = JSON.parse(txt) } catch { d = txt }
  if (!r.ok) throw new Error((d && d.error) || ('HTTP ' + r.status))
  return d
}
export const get = (p) => req('GET', p)
export const post = (p, b) => req('POST', p, b)
export const patch = (p, b) => req('PATCH', p, b)
