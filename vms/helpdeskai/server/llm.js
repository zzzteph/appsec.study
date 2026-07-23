// A deterministic, offline stand-in for an LLM. It is NOT a real model — it is a
// rule engine that imitates how a naive, instruction-following assistant behaves,
// so the classic LLM-app weaknesses are reproducible with zero external calls:
//   * it "follows instructions" it finds ANYWHERE in the prompt (system, retrieved
//     documents, tool output, or the user message) -> prompt injection, direct
//     and indirect (LLM01)
//   * when aligned it refuses secrets/tools; a single injection trigger flips it
//     to a compromised state where it obeys attacker directives
//   * it emits raw tool output back to the user -> insecure output handling (LLM02)
//   * it will call privileged tools when directed -> excessive agency (LLM08)

// override / jailbreak triggers -> compromised (matched only against UNTRUSTED
// input, never the trusted system prompt)
const INJECTION_RE = /(?:ignore|disregard|forget|override|bypass)\b[^.\n]{0,48}(?:previous|above|prior|earlier|instruction|instructions|rule|rules|system|policy|guardrail)|system\s*override|new\s+instructions?\s*:|you\s+are\s+now\b|act\s+as\b|do\s+anything\s+now|\bDAN\b/i
// tool directives found in the text
const RUN_DIAG = /run(?:\s+a)?[_ ]?(?:diagnostic|diag|command|shell|cmd)s?\b\s*[:=(]?\s*["'`]?([^"'`\n)]+)/i
const GET_ORDER = /(?:look\s?up|get|show|fetch|retrieve|pull|display)\s+order\s*#?\s*(\d+)/i
const GET_CUST = /(?:look\s?up|get|show|fetch|retrieve|pull|display)\s+(?:customer|user|account|profile|record)\s+(?:for\s+|of\s+|record\s+)?#?\s*([^\s,.;]+)/i

const asText = (r) => typeof r === 'string' ? r : JSON.stringify(r, null, 2)
function bestDoc(docs, q) {
  const words = String(q).toLowerCase().match(/[a-z0-9]{3,}/g) || []
  let best = null, bestScore = 0
  for (const d of docs) {
    const hay = (d.title + ' ' + (d.tags || '') + ' ' + d.body).toLowerCase()
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0)
    if (score > bestScore) { bestScore = score; best = d }
  }
  return bestScore > 0 ? best : null
}

// state: { system, docs:[{title,body,tags,internal}], toolLog:[{name,args,result}], user }
function run(state) {
  const { system, docs = [], toolLog = [], user = '' } = state
  // untrusted = everything the attacker can influence (their message, retrieved
  // documents, tool output). The system prompt is trusted and excluded here.
  const untrusted = [...docs.map(d => d.title + ': ' + d.body), ...toolLog.map(t => `tool ${t.name} -> ${asText(t.result)}`), user].join('\n')
  const compromised = INJECTION_RE.test(untrusted) || /ESC-9987/i.test(user)   // supplying the leaked escalation code also unlocks it

  // once a tool has run, hand its result back verbatim (insecure output handling)
  if (toolLog.length) {
    const last = toolLog[toolLog.length - 1]
    return { type: 'final', text: `Done — ${last.name} returned:\n${asText(last.result)}` }
  }

  if (compromised) {
    if (/system\s*prompt|your\s+(instructions|rules|prompt|guidelines)|what\s+were\s+you\s+(told|instructed|given)|repeat[^.\n]*(above|prior|system|instructions)/i.test(user))
      return { type: 'final', text: system }
    if (/escalation\s*code/i.test(user)) return { type: 'final', text: 'The escalation code is ESC-9987.' }
    const diag = user.match(RUN_DIAG) || untrusted.match(RUN_DIAG)
    if (diag) return { type: 'tool', name: 'run_diagnostic', args: { cmd: diag[1].trim() } }
    const ord = user.match(GET_ORDER) || untrusted.match(GET_ORDER)
    if (ord) return { type: 'tool', name: 'get_order', args: { id: ord[1] } }
    const cust = user.match(GET_CUST) || untrusted.match(GET_CUST)
    if (cust) return { type: 'tool', name: 'get_customer', args: { who: cust[1] } }
    if (/master\s*(api\s*)?key|internal\s+(kb|knowledge|doc|credential|article)/i.test(user))
      return { type: 'tool', name: 'search_kb', args: { q: 'internal credentials master key escalation', internal: true } }
    // generic compliance: dump the retrieved context (may contain internal docs)
    return { type: 'final', text: 'Sure — here is everything currently in my context:\n' + docs.map(d => d.title + ': ' + d.body).join('\n') }
  }

  // ---- aligned behaviour ----
  if (/password\s*(is|:)|secret|escalation|master\s*key|api\s*key|diagnostic|\brun\b.*\b(shell|command|cmd)\b|internal/i.test(user))
    return { type: 'final', text: "I'm sorry, but I can't help with that. Diagnostics and internal resources are limited to authorised support staff." }
  if (/\bmy\b.*\border|where.*\b(order|package|delivery)\b|track/i.test(user))
    return { type: 'tool', name: 'get_my_orders', args: {} }
  const best = bestDoc(docs.filter(d => !d.internal), user)
  if (best) return { type: 'final', text: best.body }
  return { type: 'final', text: "I couldn't find an exact article for that. Try rephrasing, or open a support ticket and our team will follow up." }
}
module.exports = { run }
