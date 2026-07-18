const ENDPOINT = '/graphql'

export const store = {
  get access() { return localStorage.getItem('g_at') || '' },
  set access(v) { v ? localStorage.setItem('g_at', v) : localStorage.removeItem('g_at') },
  get refresh() { return localStorage.getItem('g_rt') || '' },
  set refresh(v) { v ? localStorage.setItem('g_rt', v) : localStorage.removeItem('g_rt') },
  get cart() { return localStorage.getItem('g_cart') || '' },
  set cart(v) { if (v) localStorage.setItem('g_cart', v) }
}

export function saveAuth(payload) {
  store.access = payload.accessToken
  store.refresh = payload.refreshToken
}
export function logout() { store.access = ''; store.refresh = '' }
export function isAuthed() { return !!store.access }

export async function gql(query, variables) {
  const headers = { 'Content-Type': 'application/json' }
  if (store.access) headers['Authorization'] = 'Bearer ' + store.access
  if (store.cart) headers['x-cart-id'] = store.cart
  const res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ query, variables }) })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}
