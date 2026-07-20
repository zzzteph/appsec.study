const API = '/api'

async function req(method, path, body, token) {
  const h = {}
  if (body !== undefined) h['Content-Type'] = 'application/json'
  if (token) h['Authorization'] = 'Bearer ' + token
  const r = await fetch(API + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined })
  const txt = await r.text()
  let data; try { data = JSON.parse(txt) } catch { data = txt }
  if (!r.ok) throw new Error((data && data.error) || r.status)
  return data
}
export const get = (p, token) => req('GET', p, undefined, token)
export const post = (p, b, token) => req('POST', p, b, token)

// raw text fetch (docs viewer returns text/plain)
export async function getText(p) {
  const r = await fetch(API + p)
  const t = await r.text()
  if (!r.ok) throw new Error(t)
  return t
}
