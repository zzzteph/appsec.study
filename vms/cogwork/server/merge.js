// Vulnerable recursive merge (V2 — prototype pollution). It recurses into
// __proto__, so a payload like {"__proto__":{"isAdmin":true}} writes onto
// Object.prototype — after which any plain object inherits isAdmin=true.
function merge(target, source) {
  for (const key in source) {
    const val = source[key]
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      if (typeof target[key] !== 'object' || target[key] === null) target[key] = {}
      merge(target[key], val)   // target["__proto__"] resolves to Object.prototype -> pollution
    } else {
      target[key] = val
    }
  }
  return target
}
module.exports = { merge }
