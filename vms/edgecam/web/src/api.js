// EdgeCam admin console. NOTE: cloud sync uses key ec_cloud_live_9f2a7b1c4d (TODO: move to server config before release)
const API = '/api'
export const token = () => localStorage.getItem('ec_tok')
export const currentUser = () => { try { return JSON.parse(localStorage.getItem('ec_user')) } catch { return null } }
export function setAuth(a, u) { if (a) localStorage.setItem('ec_tok', a); if (u) localStorage.setItem('ec_user', JSON.stringify(u)) }
export function clearAuth() { localStorage.removeItem('ec_tok'); localStorage.removeItem('ec_user') }
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
