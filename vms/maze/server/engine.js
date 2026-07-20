// ============================================================================
// maze generation engine — the "chain database" + constraint solver.
//
// A generation is chosen across several AXES (api transport, auth model, which feature blocks are
// mounted, which vulns/variants are live). Exploitation is modelled as a CAPABILITY GRAPH: each
// PRIMITIVE (a concrete vuln in a block) consumes some capabilities and grants others, terminating in
// RCE. The generator:
//   1. picks axes under exclusion rules,
//   2. computes which primitives are *available* for those axes,
//   3. GUARANTEES solvability by finding a real NONE→RCE path (graph reachability) and force-enabling it,
//   4. adds random extra blocks + side-vulns as noise/decoys,
//   5. re-validates that RCE is reachable from the *enabled* set only.
// Because a set of transport/auth-agnostic primitives always exists (e.g. sqli→login→cmdi), a solvable
// chain can never fail to exist — that's what removes the "no chain" failure mode.
// No simulated victim users: XSS/CSRF/open-redirect etc. are "side" primitives that grant nothing
// toward RCE, so they are discoverable extras, never a required (victim-dependent) chain step.
// ============================================================================

// ---- capabilities (nodes in the graph) ----
const CAP = { START: 'START', USER: 'USER', ADMIN_CREDS: 'ADMIN_CREDS', SECRET: 'SECRET', ADMIN: 'ADMIN', INTERNAL: 'INTERNAL', RCE: 'RCE' }

// ---- axes ----
const API_STYLES = [{ v: 'rest', w: 5 }, { v: 'graphql', w: 3 }, { v: 'traditional', w: 3 }]
const AUTH_STYLES = [{ v: 'jwt', w: 4 }, { v: 'session', w: 4 }, { v: 'apikey', w: 2 }]

// ---- feature block catalog: ~120 small blocks across the apps. Each block's `kind` decides which
// feature + vulns it implements; primitive host-lists are DERIVED from kind, so adding blocks scales
// the maze (more hosts per vuln → combinatorially more distinct chains). ----
const BLOCKS = []
const B = (app, kind, admin, ids) => { for (const id of ids) BLOCKS.push({ id, app, kind, admin: !!admin }) }
B('blog', 'content', 0, ['blog', 'blog-featured', 'blog-comments'])
B('blog', 'feature', 0, ['blog-tags', 'blog-archive', 'blog-authors', 'blog-rss', 'blog-related', 'blog-newsletter'])
B('blog', 'fileportal', 0, ['blog-drafts']); B('blog', 'adminreport', 1, ['blog-admin'])
B('news', 'content', 0, ['news', 'news-opinion', 'news-topics'])
B('news', 'feature', 0, ['news-ticker', 'news-sports', 'news-alerts', 'news-live', 'news-video', 'news-digest'])
B('news', 'webhook', 0, ['news-weather']); B('news', 'adminreport', 1, ['news-admin'])
B('paste', 'content', 0, ['pastebin', 'paste-trending']); B('paste', 'fileportal', 0, ['paste-raw'])
B('paste', 'feature', 0, ['paste-recent', 'paste-syntax', 'paste-expire', 'paste-collections', 'paste-embed'])
B('paste', 'adminbackup', 1, ['pastebin-admin'])
B('chat', 'content', 0, ['chat-threads', 'chat-search'])
B('chat', 'feature', 0, ['chat', 'chat-rooms', 'chat-dm', 'chat-presence', 'chat-emoji', 'chat-pinned'])
B('shop', 'content', 0, ['shop-catalog', 'shop-reviews'])
B('shop', 'feature', 0, ['shop-cart', 'shop-orders', 'shop-wishlist', 'shop-coupons', 'shop-categories', 'shop-giftcards', 'shop-recommend', 'shop-recent', 'shop-compare'])
B('shop', 'webhook', 0, ['shop-shipping', 'shop-tracking', 'offers'])
B('shop', 'import', 0, ['shop-returns', 'invoices']); B('shop', 'adminbackup', 1, ['shop-admin']); B('shop', 'import', 1, ['invoices-admin'])
B('social', 'content', 0, ['social-feed', 'social-people', 'social-hashtags', 'social-explore'])
B('social', 'feature', 0, ['social-profile', 'favourites', 'social-follow', 'social-notifications', 'social-groups', 'social-bookmarks', 'social-stories', 'social-likes', 'messages', 'social-events'])
B('account', 'account', 0, ['user-panel', 'profile-editor', 'account-settings', 'account-security'])
B('account', 'fileportal', 0, ['menu-editor', 'account-export']); B('account', 'disclosure', 0, ['account-tokens'])
B('account', 'webhook', 0, ['account-connected', 'account-avatar'])
B('account', 'feature', 0, ['account-billing', 'account-sessions', 'account-prefs'])
B('partner', 'content', 0, ['partner-apply', 'partner-support']); B('partner', 'fileportal', 0, ['partner-docs'])
B('partner', 'webhook', 0, ['partner-webhook', 'partner-leads']); B('partner', 'import', 0, ['partner-invoice', 'partner-onboarding'])
B('partner', 'feature', 0, ['partner-directory', 'partner-contracts', 'partner-payouts', 'partner-commissions'])
B('admin', 'adminreport', 1, ['admin-reports', 'admin-templates', 'admin-announce'])
B('admin', 'adminbackup', 1, ['admin-backup', 'admin-jobs', 'admin-moderation', 'admin-queue'])
B('admin', 'adminupload', 1, ['admin-extensions', 'admin-integrations']); B('admin', 'disclosure', 1, ['admin-settings', 'admin-apikeys'])
B('admin', 'fileportal', 1, ['admin-logs']); B('admin', 'webhook', 1, ['admin-webhooks'])
B('admin', 'feature', 1, ['admin-users', 'admin-audit', 'admin-flags', 'admin-metrics', 'admin-roles'])
B('platform', 'disclosure', 0, ['api-docs', 'platform-status', 'platform-changelog', 'platform-sitemap'])
B('platform', 'content', 0, ['platform-search', 'platform-feedback']); B('platform', 'fileportal', 0, ['platform-help'])
const BLOCK_IDS = new Set(BLOCKS.map(b => b.id))
const ofKind = (k) => BLOCKS.filter(b => b.kind === k).map(b => b.id)
const pubOfKind = (k) => BLOCKS.filter(b => b.kind === k && !b.admin).map(b => b.id)

// ---- primitive catalog (the "chain DB"). blocks: any-of hosts. kind: acquire|auth|internal|sink|side.
//      req/grants: capabilities. auth/api: axis constraints (omit = universal). weight: noise probability.
const PRIMITIVES = [
  // ---------- acquisition: START -> creds / secret / internal ----------
  { id: 'sqli', kind: 'acquire', blocks: ofKind('content'), vuln: 'sqli', variants: ['union', 'error', 'blind-bool', 'blind-time'], req: [CAP.START], grants: [CAP.ADMIN_CREDS], w: 0.35 },
  { id: 'xxe', kind: 'acquire', blocks: ofKind('import'), vuln: 'xxe', variants: ['file', 'param-entity'], req: [CAP.START], grants: [CAP.ADMIN_CREDS, CAP.SECRET], w: 0.3 },
  { id: 'lfi', kind: 'acquire', blocks: ofKind('fileportal'), vuln: 'lfi', variants: ['traversal', 'absolute', 'null-byte'], req: [CAP.START], grants: [CAP.SECRET], w: 0.3 },
  { id: 'disclosure-source', kind: 'acquire', blocks: pubOfKind('disclosure'), vuln: 'source-disclosure', variants: ['git', 'bak', 'sourcemap', 'swagger-example'], req: [CAP.START], grants: [CAP.ADMIN_CREDS, CAP.SECRET], w: 0.3 },
  { id: 'ssrf', kind: 'acquire', blocks: ofKind('webhook'), vuln: 'ssrf', variants: ['full', 'redirect', 'gopher'], req: [CAP.START], grants: [CAP.INTERNAL], w: 0.3 },
  // Cloud-metadata SSRF — different capability terminal (leaks SECRET rather than INTERNAL): the
  // "metadata service" reply contains the app HS256 key (so a subsequent jwt-forge/session-file wins).
  { id: 'ssrf-cloudmeta', kind: 'acquire', blocks: ofKind('webhook'), vuln: 'ssrf-cloud', variants: ['aws-imds', 'gcp-metadata'], req: [CAP.START], grants: [CAP.SECRET], w: 0.2 },

  // ---------- auth transitions: creds/secret -> ADMIN (constrained by auth model) ----------
  { id: 'login', kind: 'auth', blocks: ofKind('account'), vuln: null, req: [CAP.ADMIN_CREDS], grants: [CAP.ADMIN], w: 1 },
  // intermediate capability: register + log in as a NORMAL user (feature) → enables multi-hop chains
  { id: 'register', kind: 'auth', blocks: ofKind('account'), vuln: null, req: [CAP.START], grants: [CAP.USER], w: 1 },
  { id: 'bola-read', kind: 'acquire', blocks: ofKind('account'), vuln: 'bola', variants: ['sequential-id', 'by-username'], req: [CAP.USER], grants: [CAP.ADMIN_CREDS], w: 0.35 },
  { id: 'login-bypass', kind: 'auth', blocks: ofKind('account'), vuln: 'sqli-login', variants: ['comment', 'or-true'], req: [CAP.START], grants: [CAP.ADMIN], auth: ['jwt', 'session'], w: 0.25 },
  { id: 'reset-weak', kind: 'auth', blocks: ofKind('account'), vuln: 'weak-reset-token', variants: ['predictable', 'leaked-in-response'], req: [CAP.START], grants: [CAP.ADMIN], w: 0.15 },
  { id: 'jwt-forge', kind: 'auth', blocks: ofKind('account'), vuln: 'jwt-forge', variants: ['leaked-key'], req: [CAP.SECRET], grants: [CAP.ADMIN], auth: ['jwt'], w: 0.5 },
  { id: 'jwt-algnone', kind: 'auth', blocks: ofKind('account'), vuln: 'jwt-alg-none', variants: ['none', 'HS-RS-confusion'], req: [CAP.START], grants: [CAP.ADMIN], auth: ['jwt'], w: 0.25 },
  { id: 'jwt-weak-secret', kind: 'auth', blocks: ofKind('account'), vuln: 'jwt-weak-secret', variants: ['dictionary'], req: [CAP.START], grants: [CAP.ADMIN], auth: ['jwt'], w: 0.2 },
  { id: 'session-predict', kind: 'auth', blocks: ofKind('account'), vuln: 'predictable-session', variants: ['sequential', 'timestamp'], req: [CAP.START], grants: [CAP.ADMIN], auth: ['session'], w: 0.25 },
  { id: 'session-file', kind: 'auth', blocks: ofKind('account'), vuln: 'session-store-lfi', variants: ['file'], req: [CAP.SECRET], grants: [CAP.ADMIN], auth: ['session'], w: 0.3 },
  { id: 'apikey-leak', kind: 'auth', blocks: pubOfKind('disclosure'), vuln: 'apikey-disclosure', variants: ['docs', 'response', 'header'], req: [CAP.START], grants: [CAP.ADMIN], auth: ['apikey'], w: 0.5 },
  // "Remember me" cookie — set on login, resolved as an admin session on future requests (session only)
  { id: 'remember-me', kind: 'auth', blocks: ofKind('account'), vuln: 'remember-me-cookie', variants: ['base64-username', 'plain-username'], req: [CAP.START], grants: [CAP.ADMIN], auth: ['session'], w: 0.2 },

  // ---------- internal reach -> RCE ----------
  { id: 'internal-runtask', kind: 'internal', blocks: ofKind('webhook'), vuln: null, req: [CAP.INTERNAL], grants: [CAP.RCE], w: 1 },

  // ---------- sinks: ADMIN -> RCE (varied RCE type) ----------
  { id: 'sink-ssti', kind: 'sink', blocks: ofKind('adminreport'), vuln: 'ssti', variants: ['eval', 'ejs', 'handlebars', 'pug'], req: [CAP.ADMIN], grants: [CAP.RCE], w: 0.5 },
  { id: 'sink-cmdi', kind: 'sink', blocks: ofKind('adminbackup'), vuln: 'cmdi', variants: ['tar', 'ping', 'zip', 'git'], req: [CAP.ADMIN], grants: [CAP.RCE], w: 0.5 },
  { id: 'sink-upload', kind: 'sink', blocks: ofKind('fileportal').concat(ofKind('adminupload')), vuln: 'upload', variants: ['js-require', 'ejs-template'], req: [CAP.ADMIN], grants: [CAP.RCE], w: 0.4 },
  { id: 'sink-deserial', kind: 'sink', blocks: ofKind('adminbackup').concat(ofKind('account')), vuln: 'deserialization', variants: ['node-serialize', 'funcster'], req: [CAP.ADMIN], grants: [CAP.RCE], w: 0.3 },

  // ---------- side vulns (grant nothing toward RCE — discovery-only maze walls) ----------
  { id: 'side-idor', kind: 'side', blocks: ofKind('feature'), vuln: 'idor', variants: ['sequential', 'guessable-uuid'], req: [CAP.START], grants: [], w: 0.4 },
  { id: 'side-xss-stored', kind: 'side', blocks: ofKind('content'), vuln: 'stored-xss', variants: ['html', 'attr', 'js'], req: [CAP.START], grants: [], w: 0.45 },
  { id: 'side-open-redirect', kind: 'side', blocks: ofKind('webhook').concat(ofKind('feature')), vuln: 'open-redirect', variants: ['param'], req: [CAP.START], grants: [], w: 0.25 },
  { id: 'side-massassign', kind: 'side', blocks: ofKind('account'), vuln: 'mass-assignment', variants: ['role', 'credit'], req: [CAP.START], grants: [CAP.ADMIN], w: 0.2 },
  { id: 'side-price', kind: 'side', blocks: ofKind('feature'), vuln: 'price-tamper', variants: ['client-price', 'negative-qty'], req: [CAP.START], grants: [], w: 0.3 },
  { id: 'side-verbose-errors', kind: 'side', blocks: pubOfKind('disclosure').concat(ofKind('content')), vuln: 'verbose-errors', variants: ['stack', 'sql'], req: [CAP.START], grants: [], w: 0.4 },

  // ---------- new fleet-wide side vulns (maze walls; each variant lives distinctly) ----------
  { id: 'side-user-enum', kind: 'side', blocks: ofKind('account'), vuln: 'user-enumeration', variants: ['timing', 'message'], req: [CAP.START], grants: [], w: 0.3 },
  { id: 'side-csv-injection', kind: 'side', blocks: ofKind('feature').concat(ofKind('adminreport')), vuln: 'csv-injection', variants: ['formula'], req: [CAP.START], grants: [], w: 0.2 },
  { id: 'side-ac-header', kind: 'side', blocks: ofKind('feature'), vuln: 'access-control-header', variants: ['x-original-url', 'method-override', 'trailing-slash', 'referer-gate'], req: [CAP.START], grants: [], w: 0.3 },
  { id: 'side-ssrf-gopher', kind: 'side', blocks: ofKind('webhook'), vuln: 'ssrf-gopher', variants: ['gopher'], req: [CAP.START], grants: [], w: 0.15 },
  { id: 'side-coupon', kind: 'side', blocks: ofKind('feature'), vuln: 'coupon-abuse', variants: ['stack', 'reuse'], req: [CAP.START], grants: [], w: 0.2 },
  { id: 'side-oversell', kind: 'side', blocks: ofKind('feature'), vuln: 'stock-oversell', variants: ['negative-qty', 'no-check'], req: [CAP.START], grants: [], w: 0.2 },
  { id: 'side-bfla', kind: 'side', blocks: ofKind('feature'), vuln: 'bfla', variants: ['no-admin-check'], req: [CAP.START], grants: [], w: 0.2 },
  { id: 'side-refresh-noop', kind: 'side', blocks: ofKind('account'), vuln: 'refresh-no-rotation', variants: ['reusable'], req: [CAP.START], grants: [], w: 0.15 },

  // ---------- fleet-audit additions: new CHAIN primitives (grant ADMIN/ADMIN_CREDS) ----------
  // impersonation / "login as" — an endpoint that mints a credential for ANY username with no admin
  // check (graph/shoppy loginAs, nomnom/boxcutter auth-test). START -> ADMIN directly.
  { id: 'login-as', kind: 'auth', blocks: ofKind('account'), vuln: 'impersonation', variants: ['no-check', 'debug-endpoint'], req: [CAP.START], grants: [CAP.ADMIN], w: 0.2 },
  // BOLA write — profile/password update that trusts an attacker-supplied username and writes ANY user
  // (graph/shoppy updateProfile). Needs a normal-user foothold; sets the admin password you then log in with.
  { id: 'bola-write', kind: 'acquire', blocks: ofKind('account'), vuln: 'bola-write', variants: ['any-user-password'], req: [CAP.USER], grants: [CAP.ADMIN_CREDS], w: 0.2 },

  // ---------- fleet-audit additions: side vulns (maze walls; grant nothing toward RCE) ----------
  { id: 'side-cors', kind: 'side', blocks: ofKind('feature').concat(ofKind('account')), vuln: 'cors-misconfig', variants: ['reflect-origin'], req: [CAP.START], grants: [], w: 0.25 },
  { id: 'side-host-header', kind: 'side', blocks: ofKind('account'), vuln: 'host-header-injection', variants: ['reset-link'], req: [CAP.START], grants: [], w: 0.15 },
  { id: 'side-cache-poison', kind: 'side', blocks: ofKind('feature'), vuln: 'web-cache-poisoning', variants: ['x-forwarded-host'], req: [CAP.START], grants: [], w: 0.12 },
  { id: 'side-cookie-flags', kind: 'side', blocks: ofKind('account'), vuln: 'insecure-cookie', variants: ['no-httponly'], req: [CAP.START], grants: [], w: 0.15 },
  { id: 'side-clickjack', kind: 'side', blocks: ofKind('feature'), vuln: 'clickjacking', variants: ['no-xfo'], req: [CAP.START], grants: [], w: 0.12 },
  { id: 'side-email-header', kind: 'side', blocks: ofKind('feature').concat(ofKind('content')), vuln: 'email-header-injection', variants: ['newline'], req: [CAP.START], grants: [], w: 0.12 },
  { id: 'side-redos', kind: 'side', blocks: ofKind('feature'), vuln: 'redos', variants: ['catastrophic'], req: [CAP.START], grants: [], w: 0.1 },
  { id: 'side-csrf', kind: 'side', blocks: ofKind('account').concat(ofKind('feature')), vuln: 'csrf', variants: ['get-state-change'], req: [CAP.START], grants: [], w: 0.2 },
  { id: 'side-xpath', kind: 'side', blocks: ofKind('content'), vuln: 'xpath-injection', variants: ['auth-bypass'], req: [CAP.START], grants: [], w: 0.12 },
  { id: 'side-ldap', kind: 'side', blocks: ofKind('content'), vuln: 'ldap-injection', variants: ['filter-bypass'], req: [CAP.START], grants: [], w: 0.12 },
  { id: 'side-nosql', kind: 'side', blocks: ofKind('account'), vuln: 'nosql-injection', variants: ['operator'], req: [CAP.START], grants: [], w: 0.15 },
  { id: 'side-excessive-data', kind: 'side', blocks: ofKind('feature'), vuln: 'excessive-data-exposure', variants: ['pan', 'pii'], req: [CAP.START], grants: [], w: 0.2 },
  { id: 'side-cms-unauth', kind: 'side', blocks: ofKind('content'), vuln: 'broken-access-control', variants: ['unauth-edit'], req: [CAP.START], grants: [], w: 0.15 },
  { id: 'side-privesc-self', kind: 'side', blocks: ofKind('account'), vuln: 'privilege-escalation', variants: ['self-promote'], req: [CAP.START], grants: [], w: 0.15 },
  { id: 'side-refund-abuse', kind: 'side', blocks: ofKind('feature'), vuln: 'refund-abuse', variants: ['unbounded'], req: [CAP.START], grants: [], w: 0.15 },
  { id: 'side-status-abuse', kind: 'side', blocks: ofKind('feature'), vuln: 'order-status-abuse', variants: ['no-payment'], req: [CAP.START], grants: [], w: 0.15 },
  { id: 'side-race', kind: 'side', blocks: ofKind('feature'), vuln: 'race-condition', variants: ['toctou'], req: [CAP.START], grants: [], w: 0.1 },
  { id: 'side-giftcard-enum', kind: 'side', blocks: ofKind('feature'), vuln: 'giftcard-enumeration', variants: ['sequential'], req: [CAP.START], grants: [], w: 0.12 },
  { id: 'side-credit-transfer', kind: 'side', blocks: ofKind('feature'), vuln: 'credit-transfer-theft', variants: ['negative-amount'], req: [CAP.START], grants: [], w: 0.12 },
  { id: 'side-predictable-apikey', kind: 'side', blocks: ofKind('account'), vuln: 'predictable-apikey', variants: ['username-derived'], req: [CAP.START], grants: [], w: 0.12 },
  { id: 'side-dom-xss', kind: 'side', blocks: ofKind('content').concat(ofKind('feature')), vuln: 'dom-xss', variants: ['innerhtml', 'document-write'], req: [CAP.START], grants: [], w: 0.2 },
  { id: 'side-rfi', kind: 'side', blocks: ofKind('webhook'), vuln: 'remote-file-include', variants: ['url-include'], req: [CAP.START], grants: [], w: 0.12 },
  { id: 'side-header-trust', kind: 'side', blocks: ofKind('feature'), vuln: 'header-trust-bypass', variants: ['x-admin', 'x-forwarded-for'], req: [CAP.START], grants: [], w: 0.15 },

  // ---------- bugbounty-monitor (CWE) taxonomy additions — in-scope side vulns for a Node/SQLite app ----------
  { id: 'side-weak-hash', kind: 'side', blocks: ofKind('account'), vuln: 'reversible-weak-hash', variants: ['md5-unsalted', 'sha1'], req: [CAP.START], grants: [], w: 0.15 },
  { id: 'side-no-ratelimit', kind: 'side', blocks: ofKind('account'), vuln: 'no-rate-limit', variants: ['no-lockout'], req: [CAP.START], grants: [], w: 0.15 },
  { id: 'side-session-fixation', kind: 'side', blocks: ofKind('account'), vuln: 'session-fixation', variants: ['client-set-sid'], req: [CAP.START], grants: [], w: 0.12 },
  { id: 'side-unicode-collision', kind: 'side', blocks: ofKind('account'), vuln: 'unicode-collision', variants: ['nfkc'], req: [CAP.START], grants: [], w: 0.1 },
  { id: 'side-double-encoding', kind: 'side', blocks: ofKind('fileportal').concat(ofKind('feature')), vuln: 'double-encoding-bypass', variants: ['double-url'], req: [CAP.START], grants: [], w: 0.12 },
  { id: 'side-log-secrets', kind: 'side', blocks: ofKind('disclosure').concat(ofKind('adminreport')), vuln: 'secrets-in-logs', variants: ['token', 'apikey'], req: [CAP.START], grants: [], w: 0.15 },
  { id: 'side-vuln-deps', kind: 'side', blocks: pubOfKind('disclosure'), vuln: 'known-vuln-components', variants: ['manifest'], req: [CAP.START], grants: [], w: 0.12 },
]

// ---- presentation: per generation each block gets a randomized name/slug + one of several UI layout
// variants, so appearance is DECOUPLED from the vulns inside (you can't fingerprint a bug by its UI). ----
const UI_VARIANTS = 5
const NAMES = {
  blog: ['Journal', 'Notes', 'Updates', 'Articles', 'Stream'], news: ['Newsroom', 'Wire', 'Bulletin', 'Digest', 'Headlines'],
  paste: ['Snippets', 'Pastes', 'Clipboard', 'Dropbin', 'Gists'], chat: ['Rooms', 'Lounge', 'Talk', 'Channels', 'Threads'],
  shop: ['Store', 'Market', 'Shop', 'Goods', 'Bazaar'], social: ['Community', 'Feed', 'Circle', 'Network', 'Wall'],
  account: ['Account', 'Profile', 'Workspace', 'Settings', 'You'], partner: ['Partners', 'Vendors', 'Affiliates', 'Channel', 'Alliances'],
  admin: ['Admin', 'Console', 'Ops', 'Backoffice', 'Control'], platform: ['Platform', 'System', 'Core', 'Hub', 'Service'],
}
const { makeRng, randomSeed } = require('./rng')
let RNG = Math.random   // replaced per-generation with a seeded PRNG so output is reproducible

function present(block) {
  const opts = NAMES[block.app] || [block.id]
  const title = pick(opts)
  return { uiVariant: Math.floor(RNG() * UI_VARIANTS), title, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + RNG().toString(36).slice(2, 5) }
}

// ---- seeded pickers (all randomness flows through RNG) ----
function wpick(arr) { const t = arr.reduce((s, x) => s + x.w, 0); let r = RNG() * t; for (const x of arr) { if ((r -= x.w) <= 0) return x.v } return arr[arr.length - 1].v }
function pick(a) { return a[Math.floor(RNG() * a.length)] }
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(RNG() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }

// primitives available for the chosen axes
function availableFor(api, auth) { return PRIMITIVES.filter(p => (!p.auth || p.auth.includes(auth)) && (!p.api || p.api.includes(api))) }

// forward reachability: returns an ordered list of primitives forming a START->RCE path, or null.
function findChain(prims) {
  const have = new Set([CAP.START]); const used = []; const usedIds = new Set()
  let progress = true
  while (progress && !have.has(CAP.RCE)) {
    progress = false
    for (const p of prims) {
      if (usedIds.has(p.id)) continue
      if (p.req.every(c => have.has(c)) && p.grants.some(c => !have.has(c))) {
        p.grants.forEach(c => have.add(c)); used.push(p); usedIds.add(p.id); progress = true
        if (have.has(CAP.RCE)) break
      }
    }
  }
  if (!have.has(CAP.RCE)) return null
  // trim to a minimal path that actually reaches RCE (backward prune)
  return prunePath(used)
}
function prunePath(used) {
  // keep only primitives needed to reach RCE
  const need = new Set([CAP.RCE]); const keep = []
  for (let i = used.length - 1; i >= 0; i--) {
    const p = used[i]
    if (p.grants.some(c => need.has(c))) { keep.unshift(p); p.req.forEach(c => need.add(c)); p.grants.forEach(c => need.delete(c)) }
  }
  return keep
}

function chooseVariant(p) { return p.variants && p.variants.length ? pick(p.variants) : null }

// randomized backward selection: pick a random RCE producer, then randomly resolve each prerequisite
// capability with a random producer. Returns a primitive set (order-independent) or null.
function randomBackward(prims) {
  const producersOf = (cap) => prims.filter(p => p.grants.includes(cap))
  const chosen = new Set(); const visiting = new Set()
  function need(cap, depth) {
    if (cap === CAP.START) return true
    if (depth > 6) return false
    for (const p of shuffle(producersOf(cap))) {
      if (visiting.has(p.id)) continue
      visiting.add(p.id)
      let ok = true
      for (const c of p.req) { if (c !== CAP.START && !need(c, depth + 1)) { ok = false; break } }
      visiting.delete(p.id)
      if (ok) { chosen.add(p); return true }
    }
    return false
  }
  return need(CAP.RCE, 0) ? [...chosen] : null
}

// pick a VARIED but valid guaranteed chain: try randomized selections (validated + ordered by forward
// reachability); fall back to deterministic greedy so a chain is always produced.
function solutionChain(prims) {
  for (let t = 0; t < 12; t++) {
    const set = randomBackward(prims)
    if (set) { const path = findChain(set); if (path) return path }
  }
  return findChain(prims)
}

// ---- the generator ----
// opts: { seed?, generation?, apis?, auths? }. Same seed → identical machine (reproducible state).
function generate(opts = {}) {
  const seed = opts.seed || randomSeed()
  RNG = makeRng(seed)                              // everything below is now a pure function of `seed`
  const apiChoices = API_STYLES.filter(x => !opts.apis || opts.apis.includes(x.v))
  const authChoices = AUTH_STYLES.filter(x => !opts.auths || opts.auths.includes(x.v))
  const api = wpick(apiChoices.length ? apiChoices : API_STYLES)
  const auth = wpick(authChoices.length ? authChoices : AUTH_STYLES)
  const avail = availableFor(api, auth)

  // 1) guaranteed solution chain (varied — a different way through the maze each generation)
  const solution = solutionChain(avail)
  if (!solution) throw new Error('engine: no chain for axes ' + api + '/' + auth)

  const enabledIds = new Set()
  const active = new Set()
  const placements = []          // {block, prim, variant, solution} — which vuln is live where
  const solutionPath = []
  for (const p of solution) {
    const variant = chooseVariant(p)
    const host = pick(p.blocks.filter(b => BLOCK_IDS.has(b)))
    enabledIds.add(p.id); active.add(host)
    placements.push({ block: host, prim: p.id, variant, solution: true })
    solutionPath.push({ prim: p.id, block: host, variant })
  }

  // 2) random extra feature blocks
  for (const b of BLOCKS) if (!active.has(b.id) && RNG() < 0.5) active.add(b.id)

  // 3) DENSITY: spread vulns across MANY active hosts so a single machine exposes lots of live vulns
  //    (target 50+ placements/gen; the fleet used to show only ~10-16). Route-mounting / behaviour-
  //    changing primitives (acquire / sink / side + the account ones) get MULTIPLE instances across
  //    distinct host blocks — the same bug class recurring in many features, like a real app. Pure
  //    auth-model weaknesses (jwt-*, session-*, apikey-leak, remember-me) are resolved GLOBALLY in
  //    authmodes, so extra copies add no surface — they get a low spread. Everything is still a pure
  //    function of the seed, and ADDING instances can never reduce reachability, so the guarantee holds.
  const placedKey = new Set(placements.map(pl => pl.block + '|' + pl.prim))
  const GLOBAL_AUTH = new Set(['jwt-forge', 'jwt-algnone', 'jwt-weak-secret', 'session-predict', 'session-file', 'apikey-leak', 'remember-me'])
  const spreadOf = (p) => GLOBAL_AUTH.has(p.id) ? 1 : (p.kind === 'side' ? 7 : (p.kind === 'acquire' || p.kind === 'sink' ? 5 : 3))
  for (const p of shuffle(avail)) {
    const hosts = shuffle(p.blocks.filter(b => active.has(b) && !placedKey.has(b + '|' + p.id)))
    if (!hosts.length) continue
    const cap = spreadOf(p)
    let n = 0
    for (const h of hosts) {
      if (n >= cap) break
      if (RNG() < p.w) { enabledIds.add(p.id); placements.push({ block: h, prim: p.id, variant: chooseVariant(p), solution: false }); placedKey.add(h + '|' + p.id); n++ }
    }
  }

  // 4) validate: RCE reachable using ONLY enabled primitives
  if (!findChain(avail.filter(p => enabledIds.has(p.id)))) throw new Error('engine: enabled set not solvable')

  // 5) presentation: give every active block a randomized name/slug + UI-layout variant
  const byId = Object.fromEntries(BLOCKS.map(b => [b.id, b]))
  const placeByBlock = {}; for (const pl of placements) (placeByBlock[pl.block] = placeByBlock[pl.block] || []).push(pl)
  const views = [...active].map(id => ({ id, app: byId[id].app, kind: byId[id].kind, admin: !!byId[id].admin, ...present(byId[id]), vulns: (placeByBlock[id] || []).map(p => p.prim) }))

  return {
    seed,
    generation: opts.generation || 1,
    api, auth,
    activeBlocks: [...active],
    views,                                  // per-block presentation (uiVariant/title/slug) + which vulns live in it
    placements,
    solution: solutionPath,
    solutionKind: solution.map(p => p.id).join(' -> '),
  }
}

module.exports = { generate, findChain, availableFor, PRIMITIVES, BLOCKS, BLOCK_IDS, CAP, API_STYLES, AUTH_STYLES }
