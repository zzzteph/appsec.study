// A tiny in-process store that reproduces MongoDB query semantics faithfully —
// so the injection payloads are identical to a real Mongo backend. Supports
// $eq/$ne/$gt/$gte/$lt/$lte/$in/$regex/$or/$and and, crucially, $where (which in
// MongoDB runs SERVER-SIDE JavaScript — the source of $where injection / RCE).
function matchValue(docVal, cond) {
  if (cond !== null && typeof cond === 'object' && !Array.isArray(cond)) {
    for (const [op, val] of Object.entries(cond)) {
      switch (op) {
        case '$eq': if (docVal !== val) return false; break
        case '$ne': if (docVal === val) return false; break                 // {"$ne":null} matches anything present -> injection
        case '$gt': if (!(docVal > val)) return false; break                // {"$gt":""} matches any non-empty string -> injection
        case '$gte': if (!(docVal >= val)) return false; break
        case '$lt': if (!(docVal < val)) return false; break
        case '$lte': if (!(docVal <= val)) return false; break
        case '$in': if (!Array.isArray(val) || !val.includes(docVal)) return false; break
        case '$regex': { try { if (!new RegExp(val, cond.$options || '').test(String(docVal))) return false } catch { return false } break }  // blind extraction
        case '$options': break
        default: return false
      }
    }
    return true
  }
  return docVal === cond
}
function matchDoc(doc, query) {
  for (const [key, cond] of Object.entries(query || {})) {
    if (key === '$or') { if (!Array.isArray(cond) || !cond.some(q => matchDoc(doc, q))) return false; continue }
    if (key === '$and') { if (!Array.isArray(cond) || !cond.every(q => matchDoc(doc, q))) return false; continue }
    if (key === '$where') {  // MongoDB $where runs JS with the document in scope.
      try { const fn = new Function('with(this){ return (' + cond + ') }'); if (!fn.call(doc)) return false } catch { return false }
      continue
    }
    if (!matchValue(doc[key], cond)) return false
  }
  return true
}

function collection(arr) {
  return {
    find: (q) => arr.filter(d => matchDoc(d, q)),
    findOne: (q) => arr.find(d => matchDoc(d, q)) || null,
    byId: (id) => arr.find(d => String(d._id) === String(id)) || null,
    insert: (doc) => { doc._id = arr.length ? Math.max(...arr.map(d => d._id)) + 1 : 1; arr.push(doc); return doc },
    all: () => arr,
  }
}
module.exports = { collection, matchDoc }
