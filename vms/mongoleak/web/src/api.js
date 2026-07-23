const API = '/api'
export const token = () => localStorage.getItem('ml_tok')
export const currentUser = () => { try { return JSON.parse(localStorage.getItem('ml_user')) } catch { return null } }
export function setAuth(a, u) { if (a) localStorage.setItem('ml_tok', a); if (u) localStorage.setItem('ml_user', JSON.stringify(u)) }
export function clearAuth() { localStorage.removeItem('ml_tok'); localStorage.removeItem('ml_user') }
async function req(method, path, body) {
  const h = {}; if (body !== undefined) h['Content-Type'] = 'application/json'
  const t = token(); if (t) h['Authorization'] = 'Bearer ' + t
  const r = await fetch(API + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined })
  const txt = await r.text(); let d; try { d = JSON.parse(txt) } catch { d = txt }
  if (!r.ok) throw new Error((d && d.error) || ('HTTP ' + r.status))
  return d
}
export const get = (p) => req('GET', p)
export const post = (p, b) => req('POST', p, b)
export const patch = (p, b) => req('PATCH', p, b)
