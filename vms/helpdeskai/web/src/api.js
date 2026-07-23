const API = '/api'
export const token = () => localStorage.getItem('hd_tok')
export const currentUser = () => { try { return JSON.parse(localStorage.getItem('hd_user')) } catch { return null } }
export function setAuth(t, u) { if (t) localStorage.setItem('hd_tok', t); if (u) localStorage.setItem('hd_user', JSON.stringify(u)) }
export function clearAuth() { localStorage.removeItem('hd_tok'); localStorage.removeItem('hd_user') }
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
