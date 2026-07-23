// FrontDesk Edge — a caching reverse proxy in front of the origin (backend.js).
// This is a deliberately-flawed edge. Planted:
//   V6  cache key is the PATH ONLY (host/forwarding headers unkeyed)  -> cache poisoning
//   V7  any path ending in a static extension is cached as public     -> cache deception
//   V3  ACL blocks /admin* by the visible request path only           -> bypass with X-Original-URL
//   V4  request body is framed by Content-Length (Transfer-Encoding
//       ignored) and forwarded over ONE shared keep-alive origin
//       socket                                                         -> CL.TE request smuggling
// It also forwards client headers verbatim (no XFF/host sanitisation).
const net = require('net')

const STATIC = /\.(css|js|mjs|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|map)(\?|$)/i
const PAGE_CACHE = new Set(['/', '/index.html', '/api/config'])
const BLOCKED = /^\/(api\/)?admin(\/|$)/i

function headerVal(headers, name) {
  const n = name.toLowerCase()
  for (const [k, v] of headers) if (k.toLowerCase() === n) return v
  return undefined
}
// Parse one HTTP message (request or response) from a Buffer. Returns
// {consumed, startLine, headers:[[k,v]], body} or null if not yet complete.
// Body length is taken from Content-Length, else chunked, else (responses) 0.
function parseMessage(buf, isResponse) {
  const idx = buf.indexOf('\r\n\r\n')
  if (idx < 0) return null
  const head = buf.slice(0, idx).toString('latin1')
  const lines = head.split('\r\n')
  const startLine = lines[0]
  const headers = []
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].indexOf(':')
    if (c > 0) headers.push([lines[i].slice(0, c).trim(), lines[i].slice(c + 1).trim()])
  }
  const bodyStart = idx + 4
  const te = headerVal(headers, 'transfer-encoding')
  const cl = headerVal(headers, 'content-length')
  if (isResponse && te && /chunked/i.test(te)) {
    // parse chunked body
    let p = bodyStart; const chunks = []
    for (;;) {
      const nl = buf.indexOf('\r\n', p); if (nl < 0) return null
      const size = parseInt(buf.slice(p, nl).toString('latin1').trim(), 16)
      if (isNaN(size)) return null
      p = nl + 2
      if (size === 0) { const end = buf.indexOf('\r\n', p); if (end < 0) return null; p = end + 2; break }
      if (buf.length < p + size + 2) return null
      chunks.push(buf.slice(p, p + size)); p += size + 2
    }
    return { consumed: p, startLine, headers, body: Buffer.concat(chunks) }
  }
  const len = cl != null ? parseInt(cl, 10) || 0 : 0   // requests: CL-only framing (V4); responses w/o CL => 0
  if (buf.length < bodyStart + len) return null
  return { consumed: bodyStart + len, startLine, headers, body: buf.slice(bodyStart, bodyStart + len) }
}

function serialize(res, xcache) {
  const drop = new Set(['transfer-encoding', 'content-length', 'connection', 'keep-alive'])
  let h = res.startLine + '\r\n'
  for (const [k, v] of res.headers) if (!drop.has(k.toLowerCase())) h += k + ': ' + v + '\r\n'
  h += 'X-Cache: ' + xcache + '\r\n'
  h += 'Content-Length: ' + res.body.length + '\r\n'
  h += 'Connection: keep-alive\r\n\r\n'
  return Buffer.concat([Buffer.from(h, 'latin1'), res.body])
}
const mkres = (code, reason, type, bodyStr) => ({ startLine: 'HTTP/1.1 ' + code + ' ' + reason, headers: [['Content-Type', type]], body: Buffer.from(bodyStr) })

function startEdge(port, backendPort) {
  const cache = new Map()
  // ---- single shared, serialized connection to the origin (enables V4) ----
  let be = null, beBuf = Buffer.alloc(0), inflight = null, idleTimer = null
  const queue = []
  function ensureBackend() {
    if (be && !be.destroyed) return
    be = net.connect(backendPort, '127.0.0.1')
    be.on('data', (d) => { beBuf = Buffer.concat([beBuf, d]); tryComplete() })
    be.on('close', () => { be = null; if (inflight) { inflight.cb(mkres(502, 'Bad Gateway', 'application/json', '{"error":"origin closed"}')); inflight = null }; pump() })
    be.on('error', () => {})
  }
  // After a smuggle the shared origin socket is left desynced; recycle it once
  // traffic goes quiet so the instance heals itself (the demo still works live).
  function scheduleIdleReset() {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      if (!inflight && !queue.length) { if (be) try { be.destroy() } catch {} ; be = null; beBuf = Buffer.alloc(0) }
    }, 5000)
    if (idleTimer.unref) idleTimer.unref()
  }
  function tryComplete() {
    if (!inflight) return
    const msg = parseMessage(beBuf, true)
    if (!msg) return
    beBuf = beBuf.slice(msg.consumed)          // leftover response bytes stay buffered (desync shift)
    const cb = inflight.cb; inflight = null
    cb(msg)
    pump()
  }
  function pump() {
    if (inflight) return
    if (!queue.length) { scheduleIdleReset(); return }
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
    ensureBackend()
    inflight = queue.shift()
    be.write(inflight.bytes)
    tryComplete()                               // a full response may already be buffered from a smuggled request
  }
  function forward(bytes) { return new Promise((resolve) => { queue.push({ bytes, cb: resolve }); pump() }) }

  const server = net.createServer((sock) => {
    let buf = Buffer.alloc(0), busy = false
    sock.on('data', (d) => { buf = Buffer.concat([buf, d]); drain() })
    sock.on('error', () => {})
    async function drain() {
      if (busy) return
      busy = true
      try {
        for (;;) {
          const req = parseMessage(buf, false)     // CL-only framing
          if (!req) break
          const bytes = buf.slice(0, req.consumed)
          buf = buf.slice(req.consumed)
          await handle(req, bytes)
        }
      } finally { busy = false }
      if (parseMessage(buf, false)) drain()        // data that landed during the await
    }
    async function handle(req, bytes) {
      const [method, rawPath] = req.startLine.split(' ')
      const path = (rawPath || '/').split('#')[0]
      const pathNoQ = path.split('?')[0]
      // V3 edge ACL — visible path only
      if (BLOCKED.test(pathNoQ)) { sock.write(serialize(mkres(403, 'Forbidden', 'application/json', '{"error":"blocked by edge policy"}'), 'BLOCK')); return }
      const cacheable = method === 'GET' && (STATIC.test(path) || PAGE_CACHE.has(pathNoQ))
      const key = method + ' ' + path                // V6/V7 — key is path only, headers unkeyed
      if (cacheable) {
        const hit = cache.get(key)
        if (hit && hit.expires > nowish()) { sock.write(serialize(hit.res, 'HIT')); return }
      }
      const res = await forward(bytes)
      if (cacheable && /(^| )2\d\d( |$)/.test(res.startLine)) {
        const ttl = STATIC.test(path) ? 300 : 30
        cache.set(key, { res, expires: nowish() + ttl })
      }
      sock.write(serialize(res, cacheable ? 'MISS' : '-'))
    }
  })
  server.listen(port, () => console.log('edge on :' + port + ' -> origin :' + backendPort))
  return server
}
// monotonic seconds (no Date/Math.random needed)
const nowish = () => process.hrtime()[0]
module.exports = { startEdge }
