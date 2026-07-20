const API = '/api'
function tok() { return localStorage.getItem('l1_tok') }

async function req(method, path, body) {
  const h = {}
  if (body !== undefined) h['Content-Type'] = 'application/json'
  const t = tok(); if (t) h['Authorization'] = 'Bearer ' + t
  const r = await fetch(API + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined })
  const txt = await r.text()
  let data; try { data = JSON.parse(txt) } catch { data = txt }
  if (!r.ok) throw new Error((data && data.error) || r.status)
  return data
}
export const get = (p) => req('GET', p)
export const post = (p, b) => req('POST', p, b)
