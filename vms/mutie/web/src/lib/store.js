// mutie store: fetch /api/manifest, expose views + endpoints, provide REST helpers keyed to /api.
// The manifest shape is { seed, generation, api, auth, views:[{id, app, admin, kind, title, slug, uiVariant, endpoints:[{m,p,kind}]}] }.
// Views are grouped by `app` for the drawer nav. Each view calls its own block endpoints so it looks
// populated. The token field applies to Authorization: Bearer / X-API-Key / Cookie all at once.
import { reactive, computed } from 'vue'

const API = '/api'
export const state = reactive({
  manifest: null,
  views: [],
  byId: {},
  byApp: {},
  ready: false,
  err: null,
  token: '',            // free-form token (bearer or apikey)
  session: '',          // session cookie value (mutie_sid=...)
  cart: 0,
})

export async function load() {
  try {
    const r = await fetch(API + '/manifest')
    if (!r.ok) throw new Error('manifest ' + r.status)
    const m = await r.json()
    state.manifest = m
    state.views = (m.views || []).sort((a, b) => a.app.localeCompare(b.app) || a.title.localeCompare(b.title))
    state.byId = Object.fromEntries(state.views.map(v => [v.id, v]))
    state.byApp = {}
    for (const v of state.views) (state.byApp[v.app] = state.byApp[v.app] || []).push(v)
    state.ready = true
  } catch (e) { state.err = String(e && e.message || e) }
}

function headers(withJson) {
  const h = {}
  if (withJson) h['Content-Type'] = 'application/json'
  const tok = (state.token || '').trim()
  if (tok) { h['Authorization'] = 'Bearer ' + tok; h['X-API-Key'] = tok }
  const sid = (state.session || '').trim()
  if (sid) h['Cookie'] = 'mutie_sid=' + sid
  return h
}

async function req(method, path, body) {
  const opts = { method, headers: headers(body !== undefined), credentials: 'include' }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const r = await fetch(API + path, opts)
  const t = await r.text()
  let d; try { d = JSON.parse(t) } catch { d = t }
  return { ok: r.ok, status: r.status, data: d, text: t, headers: r.headers }
}
export const apiGet = (p) => req('GET', p)
export const apiPost = (p, b) => req('POST', p == null ? '/' : p, b === undefined ? {} : b)
export const apiPatch = (p, b) => req('PATCH', p, b === undefined ? {} : b)
export const apiDelete = (p) => req('DELETE', p)

export function findEndpoint(view, kind) {
  return (view.endpoints || []).find(e => e.kind === kind)
}
export function findAllEndpoints(view, kind) {
  return (view.endpoints || []).filter(e => e.kind === kind)
}
// substitute :param placeholders in an endpoint path
export function fillPath(p, params) {
  return p.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, k) => encodeURIComponent(String(params[k] == null ? '' : params[k])))
}

export const appList = computed(() => Object.keys(state.byApp).sort())
