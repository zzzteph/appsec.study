// Component factory — maps a view to a (base template, family, skin, layout, widget).
//
// FIVE orthogonal presentation axes, all pure deterministic lookups (no randomness) so appearance is
// reproducible per view AND fully DECOUPLED from the vulns inside a block:
//   • template : the base component for the block's `kind` (owns the real endpoint wiring)
//   • family   : one of 50 named "product identities" (drives skin + widget + hero + layout bias + a
//                kicker label). Two seeds put a different family on the same block → looks like a
//                different app entirely.
//   • skin     : one of 16 colour/vibe themes (CSS-variable pack scoped to the block root)
//   • layout   : one of 8 arrangement variants inside the template
//   • widget   : one of 12 collection render styles (cards/grid/list/table/masonry/…)
// Perceived permutation space = 50 families × 8 layouts × 12 widgets ≈ 4,800 (× 16 skins on top).
import ContentList from '../templates/ContentList.vue'
import FeatureList from '../templates/FeatureList.vue'
import FilePortal from '../templates/FilePortal.vue'
import WebhookTester from '../templates/WebhookTester.vue'
import DocsView from '../templates/DocsView.vue'
import AccountView from '../templates/AccountView.vue'
import AdminReport from '../templates/AdminReport.vue'
import AdminBackup from '../templates/AdminBackup.vue'
import AdminUpload from '../templates/AdminUpload.vue'
import ImportView from '../templates/ImportView.vue'

// Map view.kind → base component
const TEMPLATES = {
  content: ContentList,
  feature: FeatureList,
  fileportal: FilePortal,
  webhook: WebhookTester,
  disclosure: DocsView,
  account: AccountView,
  adminreport: AdminReport,
  adminbackup: AdminBackup,
  adminupload: AdminUpload,
  import: ImportView,
}

// ---- axes ----
export const LAYOUTS = 8
export const WIDGETS = ['cards', 'grid', 'list', 'table', 'masonry', 'carousel', 'gallery', 'tiles', 'compact', 'feed', 'kanban', 'timeline']
// 16 skins — each is a CSS-variable pack defined in styles.css as `.skin-<id>`
export const SKINS = ['indigo', 'teal', 'rose', 'amber', 'slate', 'emerald', 'violet', 'crimson', 'ocean', 'forest', 'sunset', 'mono', 'midnight', 'coral', 'steel', 'lime']

// ---- 50 named families ("what app is this"), tagged by the kinds they suit ----
// name is a vibe label; skin/widget are defaults a family prefers; hero toggles a banner; lb is a
// layout bias added to the block's uiVariant so the same block can favour a different arrangement.
const F = (name, kinds, skin, widget, hero, lb) => ({ name, kinds, skin, widget, hero: !!hero, lb: lb || 0 })
export const FAMILIES = [
  // content-ish storefronts / publications
  F('Emporium', ['content', 'feature'], 'indigo', 'cards', 1, 0),
  F('Boutique', ['content', 'feature'], 'rose', 'masonry', 1, 1),
  F('Bazaar', ['content', 'feature'], 'amber', 'gallery', 1, 2),
  F('Marketplace', ['content', 'feature'], 'teal', 'grid', 0, 0),
  F('Gazette', ['content'], 'slate', 'feed', 1, 1),
  F('Tribune', ['content'], 'crimson', 'list', 0, 2),
  F('Dispatch', ['content'], 'ocean', 'tiles', 1, 3),
  F('Chronicle', ['content'], 'forest', 'list', 0, 1),
  F('Almanac', ['content', 'feature'], 'sunset', 'cards', 0, 0),
  F('Zine', ['content'], 'coral', 'masonry', 1, 2),
  // feature boards / apps
  F('Workboard', ['feature'], 'slate', 'kanban', 0, 4),
  F('Timeline', ['feature'], 'violet', 'timeline', 0, 5),
  F('Ledger', ['feature'], 'steel', 'table', 0, 2),
  F('Gallery', ['feature'], 'midnight', 'gallery', 1, 3),
  F('Roster', ['feature'], 'emerald', 'list', 0, 1),
  F('Console', ['feature'], 'mono', 'compact', 0, 6),
  F('Studio', ['feature'], 'coral', 'cards', 1, 0),
  F('Atlas', ['feature'], 'ocean', 'tiles', 0, 3),
  F('Pulse', ['feature'], 'crimson', 'feed', 0, 5),
  F('Vault', ['feature'], 'steel', 'grid', 0, 2),
  F('Nexus', ['feature'], 'violet', 'kanban', 0, 4),
  F('Beacon', ['feature'], 'amber', 'carousel', 1, 0),
  F('Forge', ['feature'], 'forest', 'table', 0, 2),
  F('Loft', ['feature'], 'rose', 'masonry', 1, 3),
  // account / identity
  F('Passport', ['account'], 'indigo', 'list', 1, 0),
  F('Identity', ['account'], 'teal', 'list', 0, 1),
  F('Keyring', ['account'], 'slate', 'compact', 0, 2),
  F('Lobby', ['account'], 'ocean', 'cards', 1, 3),
  F('Concierge', ['account'], 'violet', 'list', 0, 4),
  // webhook / integrations
  F('Relay', ['webhook'], 'emerald', 'list', 0, 0),
  F('Bridge', ['webhook'], 'steel', 'table', 0, 1),
  F('Conduit', ['webhook'], 'midnight', 'compact', 0, 2),
  F('Signal', ['webhook'], 'crimson', 'cards', 0, 3),
  // disclosure / docs
  F('Handbook', ['disclosure'], 'slate', 'list', 0, 0),
  F('Codex', ['disclosure'], 'forest', 'table', 0, 1),
  F('Reference', ['disclosure'], 'ocean', 'compact', 0, 2),
  F('Portal', ['disclosure'], 'indigo', 'cards', 1, 3),
  // admin report
  F('Composer', ['adminreport'], 'violet', 'compact', 0, 0),
  F('Broadcast', ['adminreport'], 'crimson', 'list', 0, 1),
  F('Dossier', ['adminreport'], 'steel', 'table', 0, 2),
  // admin backup / jobs
  F('Maintenance', ['adminbackup'], 'slate', 'compact', 0, 0),
  F('Scheduler', ['adminbackup'], 'midnight', 'list', 0, 1),
  F('Operations', ['adminbackup'], 'emerald', 'table', 0, 2),
  // admin upload / extensions
  F('Extensions', ['adminupload'], 'amber', 'cards', 0, 0),
  F('Plugins', ['adminupload'], 'teal', 'grid', 0, 1),
  // import / files
  F('Intake', ['import'], 'ocean', 'compact', 0, 0),
  F('Ingest', ['import'], 'forest', 'list', 0, 1),
  F('Archive', ['fileportal'], 'slate', 'list', 0, 0),
  F('Dropbox', ['fileportal'], 'coral', 'cards', 1, 1),
  F('Repository', ['fileportal'], 'steel', 'table', 0, 2),
]

// ---- deterministic hashing (FNV-1a) so the same view always resolves identically ----
function fnv(s) { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function keyOf(view) { return (view.app || '') + '|' + (view.id || '') + '|' + (view.slug || '') + '|' + (view.uiVariant || 0) }

export function pickTemplate(view) {
  return TEMPLATES[view.kind] || FeatureList
}

export function pickFamily(view) {
  const pool = FAMILIES.filter(f => f.kinds.includes(view.kind))
  const list = pool.length ? pool : FAMILIES
  return list[fnv('fam:' + keyOf(view)) % list.length]
}

export function pickSkin(view, family) {
  // family sets the vibe, but nudge by the view hash so identical families still vary a little
  const base = SKINS.indexOf((family || pickFamily(view)).skin)
  const jitter = fnv('skin:' + keyOf(view)) % 3            // 0..2 — small drift for variety
  const idx = (base < 0 ? 0 : base + jitter) % SKINS.length
  return SKINS[idx]
}

export function pickLayout(view, family) {
  const fam = family || pickFamily(view)
  return (Math.abs(Number(view.uiVariant) || 0) + fam.lb) % LAYOUTS   // 0..7
}

export function pickWidget(view, family) {
  const fam = family || pickFamily(view)
  // family has a preferred widget; blend with the view hash so widgets still spread
  const pref = WIDGETS.indexOf(fam.widget)
  const h = fnv('wid:' + keyOf(view))
  return (h % 4 === 0 && pref >= 0) ? WIDGETS[pref] : WIDGETS[h % WIDGETS.length]
}
