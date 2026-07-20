<script setup>
// Multi-page shell. Left drawer = the APPS (blog/shop/…). Selecting an app shows its PAGES as a tab
// bar; each page is rendered by PageView as a stack of reusable BLOCKS. So every app is a multi-page
// site and every page is composed from Lego blocks that may or may not be vulnerable.
import { ref, computed, onMounted } from 'vue'
import { state, load } from './lib/store'
import PageView from './views/PageView.vue'
import DevConsole from './views/DevConsole.vue'
import AuthPanel from './views/AuthPanel.vue'

const selectedApp = ref('')
const selectedPage = ref('')   // view.id
const dev = ref(false)
const drawerOpen = ref(false)

const APP_META = {
  blog: ['Journal', '📓'], news: ['Newsroom', '📰'], paste: ['Snippets', '📎'], chat: ['Rooms', '💬'],
  shop: ['Store', '🛒'], social: ['Community', '👥'], account: ['Account', '👤'], partner: ['Partners', '🤝'],
  admin: ['Admin', '⚙️'], platform: ['Platform', '🧩'],
}
const labelFor = (a) => (APP_META[a] && APP_META[a][0]) || (a.charAt(0).toUpperCase() + a.slice(1))
const iconFor = (a) => (APP_META[a] && APP_META[a][1]) || '📁'

const apps = computed(() => Object.keys(state.byApp).sort())
const pages = computed(() => (state.byApp[selectedApp.value] || []))
const current = computed(() => state.byId[selectedPage.value] || null)

function openApp(app) {
  selectedApp.value = app; dev.value = false
  const first = (state.byApp[app] || [])[0]
  selectedPage.value = first ? first.id : ''
  drawerOpen.value = false; window.scrollTo(0, 0)
}
function openPage(id) { selectedPage.value = id; dev.value = false; window.scrollTo(0, 0) }
function openDev() { dev.value = true; drawerOpen.value = false }

function landDefault() {
  const pref = ['shop', 'blog', 'news', 'social', 'account']
  const first = pref.find(a => state.byApp[a]) || apps.value[0]
  if (first) openApp(first)
}
// deep-link: #<app> or #<app>/<slug> selects an app/page (shareable, and used for previews)
function applyHash() {
  const h = decodeURIComponent((location.hash || '').replace(/^#/, ''))
  if (!h) return landDefault()
  const [app, page] = h.split('/')
  if (app === 'dev') return openDev()
  if (app && state.byApp[app]) {
    openApp(app)
    if (page) { const v = state.byApp[app].find(x => x.slug === page || x.id === page); if (v) selectedPage.value = v.id }
    return
  }
  landDefault()
}

onMounted(async () => {
  await load()
  applyHash()
  window.addEventListener('hashchange', applyHash)
})
</script>

<template>
  <div class="shell" v-if="state.ready">
    <header class="appbar">
      <button class="hamburger" @click="drawerOpen = !drawerOpen" aria-label="menu">☰</button>
      <span class="brand"><span class="logo">◧</span> maze</span>
      <span class="chip gen" v-if="state.manifest">gen {{ state.manifest.generation }} · {{ state.manifest.api }} · {{ state.manifest.auth }}</span>
      <span class="spacer"></span>
      <AuthPanel />
    </header>

    <aside class="drawer" :class="{ open: drawerOpen }">
      <div class="dgh">Apps</div>
      <a v-for="a in apps" :key="a" :class="{ on: selectedApp === a && !dev }" @click="openApp(a)">
        <span>{{ iconFor(a) }} {{ labelFor(a) }}</span>
        <span class="d-count">{{ (state.byApp[a] || []).length }}</span>
      </a>
      <div class="dgh">Tools</div>
      <a :class="{ on: dev }" @click="openDev">🛠 Developer</a>
    </aside>
    <div class="scrim" v-if="drawerOpen" @click="drawerOpen = false"></div>

    <main>
      <DevConsole v-if="dev" />
      <template v-else-if="current">
        <div class="apptitle">{{ iconFor(selectedApp) }} {{ labelFor(selectedApp) }}</div>
        <nav class="pagetabs">
          <button v-for="p in pages" :key="p.id" :class="{ on: selectedPage === p.id }" @click="openPage(p.id)">
            {{ p.title }}<span v-if="p.admin" class="dot">•</span>
          </button>
        </nav>
        <PageView :view="current" :key="current.id" />
      </template>
      <p v-else class="muted">No pages.</p>
    </main>
  </div>
  <div v-else class="loading">
    <p class="muted" v-if="!state.err">Loading…</p>
    <p class="err" v-else>Failed to load manifest: {{ state.err }}</p>
  </div>
</template>

<style scoped>
.d-count { font-size: .7rem; color: var(--muted); background: #eef0fb; border-radius: 999px; padding: 0 .45rem; }
.apptitle { font-size: 1.3rem; font-weight: 500; color: #303f9f; margin: .2rem 0 .8rem; }
.pagetabs { display: flex; gap: .3rem; flex-wrap: wrap; margin-bottom: 1.2rem; border-bottom: 1px solid var(--line); padding-bottom: .6rem; }
.pagetabs button { border: 0; background: #eef0fb; color: #3949ab; padding: .4rem .8rem; border-radius: 999px 999px 0 0; cursor: pointer; font: inherit; font-size: .82rem; }
.pagetabs button.on { background: var(--primary, #3f51b5); color: #fff; }
.pagetabs .dot { color: #ff8f00; margin-left: .2rem; }
.dgh { padding: .7rem .9rem .3rem; color: var(--muted); font-size: .74rem; text-transform: uppercase; letter-spacing: .5px; }
</style>
