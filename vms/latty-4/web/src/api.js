const API = '/api'
const tok = () => localStorage.getItem('l4_tok')

async function req(method, path, body, extraHeaders) {
  const h = Object.assign({}, extraHeaders || {})
  if (body !== undefined) h['Content-Type'] = 'application/json'
  const t = tok(); if (t) h['Authorization'] = 'Bearer ' + t
  const r = await fetch(API + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined })
  const txt = await r.text()
  let data; try { data = JSON.parse(txt) } catch { data = txt }
  if (!r.ok) throw new Error((data && data.error) || r.status)
  return data
}
export const get = (p, headers) => req('GET', p, undefined, headers)
export const post = (p, b, headers) => req('POST', p, b, headers)
