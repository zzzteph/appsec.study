// This module (and the Dashboard that imports it) is code-split into a chunk that
// only loads AFTER login, so the API surface isn't in the initial bundle.
const BASE = '/api'
const tok = () => localStorage.getItem('g_tok') || ''

export async function api(method, p, body) {
  const res = await fetch(BASE + p, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok() },
    body: body != null ? JSON.stringify(body) : undefined
  })
  let j = {}
  try { j = await res.json() } catch (e) { /* empty */ }
  if (!res.ok) throw new Error(j.error || ('HTTP ' + res.status))
  return j
}
export const get = (p) => api('GET', p)
export const post = (p, b) => api('POST', p, b)
export const patch = (p, b) => api('PATCH', p, b)
export const del = (p) => api('DELETE', p)
