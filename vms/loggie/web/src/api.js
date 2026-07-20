// Post-login API client. Code-split (imported only by Dashboard.vue), so the initial bundle never
// references /api/run or /api/me — the RCE surface appears only after login. Auto-refreshes the
// 1-minute access token on 401, transparently, using the stored refresh token.
const A = '/api'
const getAccess = () => localStorage.getItem('lg_access')
const getRefresh = () => localStorage.getItem('lg_refresh')

async function raw(method, path, body, access) {
  const h = {}
  if (body !== undefined) h['Content-Type'] = 'application/json'
  if (access) h['Authorization'] = 'Bearer ' + access
  return fetch(A + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined })
}

async function refreshAccess() {
  const refresh = getRefresh()
  if (!refresh) return null
  const r = await raw('POST', '/refresh', { refresh })
  if (!r.ok) return null
  const d = await r.json()
  localStorage.setItem('lg_access', d.access)
  return d.access
}

async function req(method, path, body) {
  let r = await raw(method, path, body, getAccess())
  if (r.status === 401) {                     // access token expired (60s) → refresh once and retry
    const na = await refreshAccess()
    if (na) r = await raw(method, path, body, na)
  }
  const t = await r.text()
  let d; try { d = JSON.parse(t) } catch { d = t }
  if (!r.ok) throw new Error((d && d.error) || ('HTTP ' + r.status))
  return d
}

export const get = (p) => req('GET', p)
export const post = (p, b) => req('POST', p, b)
