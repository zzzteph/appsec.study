const API = '/api'
export const currentUser = () => { try { return JSON.parse(localStorage.getItem('mid_user')) } catch { return null } }
export const setUser = (u) => localStorage.setItem('mid_user', JSON.stringify(u))
export const clearUser = () => localStorage.removeItem('mid_user')

async function req(method, path, body) {
  const h = {}
  if (body !== undefined) h['Content-Type'] = 'application/json'
  const r = await fetch((path.startsWith('/apps') ? '' : API) + path, {
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
