const BASE = '/api'

export const store = {
  get access() { return localStorage.getItem('s_at') || '' },
  set access(v) { v ? localStorage.setItem('s_at', v) : localStorage.removeItem('s_at') },
  get refresh() { return localStorage.getItem('s_rt') || '' },
  set refresh(v) { v ? localStorage.setItem('s_rt', v) : localStorage.removeItem('s_rt') },
  get cart() { return localStorage.getItem('s_cart') || '' },
  set cart(v) { if (v) localStorage.setItem('s_cart', v) }
}
export function saveAuth(p) { store.access = p.accessToken; store.refresh = p.refreshToken }
export function logout() { store.access = ''; store.refresh = '' }
export function isAuthed() { return !!store.access }

export async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  if (store.access) headers['Authorization'] = 'Bearer ' + store.access
  if (store.cart) headers['x-cart-id'] = store.cart
  const res = await fetch(BASE + path, { method, headers, body: body != null ? JSON.stringify(body) : undefined })
  let json = {}
  try { json = await res.json() } catch (e) { /* non-json */ }
  if (!res.ok) throw new Error(json.error || ('HTTP ' + res.status))
  return json
}
export const get = (p) => api('GET', p)
export const post = (p, b) => api('POST', p, b)
export const patch = (p, b) => api('PATCH', p, b)
export const del = (p) => api('DELETE', p)
