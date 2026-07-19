// Component factory — maps a view's (kind, uiVariant) to a base template + layout variant + widget.
// Same block kind can render as up to 5 visually distinct layouts. Which widget is chosen also depends
// on the variant, giving mid-tier variety (carousel / grid / cards / masonry / list / table).
// Everything below is pure lookup — no randomness — because appearance must be reproducible per view.
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

// Widget dimension — a secondary axis of variation
const WIDGETS = ['cards', 'grid', 'list', 'table', 'masonry', 'carousel', 'gallery']

export function pickTemplate(view) {
  return TEMPLATES[view.kind] || FeatureList
}
export function pickLayout(view) {
  return Math.abs(Number(view.uiVariant) || 0) % 5    // 0..4
}
export function pickWidget(view) {
  // deterministic mix of app + variant so two seeds produce different widgets on the same block
  const s = (view.app || '') + '|' + (view.slug || '') + '|' + (view.uiVariant || 0)
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return WIDGETS[h % WIDGETS.length]
}
