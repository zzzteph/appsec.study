// A small but REAL captcha: reCAPTCHA-style. A client proves it's a browser by solving a lightweight
// proof-of-work (FNV-1a hashcash) that the SPA runs in JS → the checkbox click passes with no challenge.
// A client that can't produce the proof (headless/API-only) is served a distorted-text PNG image
// challenge whose code lives only in the pixels (needs vision/OCR to read).
const { PNG } = require('pngjs')

// ---- FNV-1a 32-bit (identical impl in web/src/pow.js so the browser can brute-force the nonce) ----
function fnv1a(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 } return h >>> 0 }
const POW_MASK = 0x1fff   // require (fnv1a(salt:nonce) & mask) === 0  → ~8192 tries avg (a few ms in JS)

// ---- 5x7 bitmap font for digits 0-9 ----
const FONT = {
  '0': [' ### ', '#   #', '#  ##', '# # #', '##  #', '#   #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  '2': [' ### ', '#   #', '    #', '   # ', '  #  ', ' #   ', '#####'],
  '3': ['#####', '   # ', '  #  ', '   # ', '    #', '#   #', ' ### '],
  '4': ['   # ', '  ## ', ' # # ', '#  # ', '#####', '   # ', '   # '],
  '5': ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '],
  '6': [' ### ', '#    ', '#    ', '#### ', '#   #', '#   #', ' ### '],
  '7': ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '],
  '8': [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '],
  '9': [' ### ', '#   #', '#   #', ' ####', '    #', '    #', ' ### '],
}
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1))

function renderCaptcha(code) {
  const scale = 6, cw = 5, ch = 7, pad = 10, gap = 8
  const charW = cw * scale, charH = ch * scale
  const W = pad * 2 + code.length * charW + (code.length - 1) * gap
  const H = pad * 2 + charH + 8
  const png = new PNG({ width: W, height: H })
  const set = (x, y, r, g, b) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255 }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, 244, 245, 249)   // light bg

  let x0 = pad
  for (const d of code) {
    const glyph = FONT[d]; const yj = ri(-4, 4); const shear = ri(-2, 2); const col = [ri(20, 90), ri(20, 90), ri(90, 170)]
    for (let r = 0; r < ch; r++) for (let c = 0; c < cw; c++) if (glyph[r][c] === '#') {
      const sx = x0 + c * scale + Math.round((r - ch / 2) * shear)
      const sy = pad + r * scale + yj + Math.round(Math.sin((x0 + c) * 0.35) * 3)
      for (let a = 0; a < scale; a++) for (let b = 0; b < scale; b++) set(sx + a, sy + b, col[0], col[1], col[2])
    }
    x0 += charW + gap
  }
  // distortion: wavy lines + random speckle
  for (let n = 0; n < 3; n++) { const col = [ri(120, 190), ri(120, 190), ri(120, 190)]; const ph = Math.random() * 6; const amp = ri(3, 7); const yb = ri(pad, H - pad); for (let x = 0; x < W; x++) set(x, yb + Math.round(Math.sin(x * 0.12 + ph) * amp), col[0], col[1], col[2]) }
  for (let n = 0; n < W * H * 0.05; n++) set(ri(0, W - 1), ri(0, H - 1), ri(120, 210), ri(120, 210), ri(120, 210))
  return PNG.sync.write(png)
}

// ---- session store ----
const sessions = new Map()   // id -> { salt, code, solved, token, exp }
const tokens = new Map()     // token -> { exp } (single-use)
const rid = () => Math.random().toString(36).slice(2, 12)
const now = () => Date.now()
function gc() { const t = now(); for (const [k, v] of sessions) if (v.exp < t) sessions.delete(k); for (const [k, v] of tokens) if (v.exp < t) tokens.delete(k) }

function newSession() {
  gc()
  const id = rid(), salt = rid()
  sessions.set(id, { salt, code: null, solved: false, token: null, exp: now() + 5 * 60000 })
  return { id, pow: { salt, mask: POW_MASK } }
}
function verifyPow(id, nonce) {
  const s = sessions.get(id); if (!s) return false
  return (fnv1a(s.salt + ':' + String(nonce)) & POW_MASK) === 0
}
function ensureCode(id) {
  const s = sessions.get(id); if (!s) return null
  if (!s.code) s.code = String(ri(0, 99999)).padStart(5, '0')   // 5-digit code
  return s.code
}
function markSolved(id) {
  const s = sessions.get(id); if (!s) return null
  s.solved = true
  const tok = rid() + rid()
  s.token = tok; tokens.set(tok, { exp: now() + 2 * 60000 })
  return tok
}
function solveImage(id, answer) {
  const s = sessions.get(id); if (!s || !s.code) return null
  if (String(answer).trim() !== s.code) return false
  return markSolved(id)
}
function consumeToken(tok) {                                     // single-use captcha token for /login
  const t = tokens.get(tok); if (!t || t.exp < now()) return false
  tokens.delete(tok); return true
}

module.exports = { newSession, verifyPow, ensureCode, renderCaptcha, markSolved, solveImage, consumeToken, peekCode: (id) => (sessions.get(id) || {}).code }
