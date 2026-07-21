const API = '/api'
const tok = () => localStorage.getItem('mf_tok')

async function req(method, path, body) {
  const h = {}
  if (body !== undefined) h['Content-Type'] = 'application/json'
  const t = tok(); if (t) h['Authorization'] = 'Bearer ' + t
  const r = await fetch(API + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined })
  const txt = await r.text()
  let d; try { d = JSON.parse(txt) } catch { d = txt }
  if (!r.ok) throw new Error((d && d.error) || ('HTTP ' + r.status))
  return d
}
export const get = (p) => req('GET', p)
export const post = (p, b) => req('POST', p, b)
export const put = (p, b) => req('PUT', p, b)
export const del = (p) => req('DELETE', p)
