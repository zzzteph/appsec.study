const BASE = '/api'

export const store = {
  get access() { return localStorage.getItem('r_at') || '' },
  set access(v) { v ? localStorage.setItem('r_at', v) : localStorage.removeItem('r_at') },
  get refresh() { return localStorage.getItem('r_rt') || '' },
  set refresh(v) { v ? localStorage.setItem('r_rt', v) : localStorage.removeItem('r_rt') }
}
export function saveTokens(t) { store.access = t.accessToken; store.refresh = t.refreshToken }
export function logout() { store.access = ''; store.refresh = '' }
export function isAuthed() { return !!store.refresh }

async function rawReq(method, p, body, useAuth) {
  const headers = { 'Content-Type': 'application/json' }
  if (useAuth && store.access) headers['Authorization'] = 'Bearer ' + store.access
  return fetch(BASE + p, { method, headers, body: body != null ? JSON.stringify(body) : undefined })
}
// When the 2-minute access token has expired the server returns 401; swap the
// refresh token for a new access token and retry the request once.
async function refreshAccess() {
  if (!store.refresh) return false
  const res = await fetch(BASE + '/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: store.refresh }) })
  if (!res.ok) { logout(); return false }
  store.access = (await res.json()).accessToken
  return true
}
export async function api(method, p, body, useAuth = true) {
  let res = await rawReq(method, p, body, useAuth)
  if (res.status === 401 && useAuth) { if (await refreshAccess()) res = await rawReq(method, p, body, useAuth) }
  let j = {}
  try { j = await res.json() } catch (e) { /* empty */ }
  if (!res.ok) throw new Error(j.error || ('HTTP ' + res.status))
  return j
}
export const get = (p, useAuth = false) => api('GET', p, null, useAuth)
export const post = (p, b, useAuth = true) => api('POST', p, b, useAuth)
export const patch = (p, b) => api('PATCH', p, b, true)
export const del = (p) => api('DELETE', p, null, true)
