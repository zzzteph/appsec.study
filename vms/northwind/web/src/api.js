const API = '/api'
export const token = () => localStorage.getItem('nw_tok')
export const currentUser = () => { try { return JSON.parse(localStorage.getItem('nw_user')) } catch { return null } }
export function setAuth(access, user) { if (access) localStorage.setItem('nw_tok', access); if (user) localStorage.setItem('nw_user', JSON.stringify(user)) }
export function clearAuth() { localStorage.removeItem('nw_tok'); localStorage.removeItem('nw_user') }

async function req(method, path, body) {
  const h = {}
  if (body !== undefined) h['Content-Type'] = 'application/json'
  const t = token(); if (t) h['Authorization'] = 'Bearer ' + t
  const r = await fetch(API + path, { method, headers: h, credentials: 'include', body: body !== undefined ? JSON.stringify(body) : undefined })
  const txt = await r.text(); let data; try { data = JSON.parse(txt) } catch { data = txt }
  if (!r.ok) throw new Error((data && data.error) || ('HTTP ' + r.status))
  return data
}
export const get = (p) => req('GET', p)
export const post = (p, b) => req('POST', p, b)
export const patch = (p, b) => req('PATCH', p, b)
