// Reusable components defined as option objects with `template` strings. With
// the full Vue build (see vite.config.js) these compile at runtime — the same
// mechanism the CSTI sink in App.vue relies on.

// VULN[vue-v-html] — raw-HTML sink.
// Vue escapes {{ text }}; v-html opts out. Post bodies, stored comments and the
// compose preview all flow through here, so <img src=x onerror=alert(1)> runs.
export const PostBody = {
  props: { html: String, cls: { type: String, default: 'body' } },
  template: `<div :class="cls" v-html="html"></div>`,
}

// VULN[vue-js-uri] — Vue does not sanitize URLs bound with :href.
// A `javascript:` URL in an author's website field runs on click.
export const AuthorLink = {
  props: { author: Object },
  template: `<a class="author-link" :href="author.website">{{ author.name }}'s site ↗</a>`,
}

// VULN[vue-iframe-embed] — user-supplied embed URL flows straight into :src.
export const Embed = {
  props: { url: String },
  template: `<iframe v-if="url" class="embed" :src="url" title="embed"></iframe>`,
}

// VULN[vue-dynamic-component] — the sidebar widget is chosen by name from
// untrusted input and rendered via <component :is>. An attacker can mount
// components never linked in the UI (here an "admin" widget leaking a secret).
export const HelloWidget = { template: `<div class="widget">👋 Hello, reader!</div>` }
export const StatsWidget = { template: `<div class="widget">1,024 readers online</div>` }
export const AdminWidget = {
  template: `<div class="widget admin">ADMIN · build token = devblog-ci-7f3a-do-not-share</div>`,
}
export const widgets = { hello: HelloWidget, stats: StatsWidget, admin: AdminWidget }
