const API = '/api'
const TOK = 'rh_tok'
const USR = 'rh_user'

export const token = () => localStorage.getItem(TOK)
export const currentUser = () => { try { return JSON.parse(localStorage.getItem(USR)) } catch { return null } }
export function setAuth(access, user) {
  if (access) localStorage.setItem(TOK, access)
  if (user) localStorage.setItem(USR, JSON.stringify(user))
}
export function clearAuth() { localStorage.removeItem(TOK); localStorage.removeItem(USR) }

async function req(method, path, body) {
  const h = {}
  if (body !== undefined) h['Content-Type'] = 'application/json'
  const t = token(); if (t) h['Authorization'] = 'Bearer ' + t
  const r = await fetch(API + path, {
    method, headers: h, credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const txt = await r.text()
  let data; try { data = JSON.parse(txt) } catch { data = txt }
  if (!r.ok) throw new Error((data && data.error) || ('HTTP ' + r.status))
  return data
}
export const get = (p) => req('GET', p)
export const post = (p, b) => req('POST', p, b)
export const patch = (p, b) => req('PATCH', p, b)
export const del = (p) => req('DELETE', p)

// Refresh the access token from the cookie session (picks up a new role).
export async function refresh() {
  try { const d = await post('/auth/refresh'); setAuth(d.access, d.user); return d.user } catch { return null }
}
