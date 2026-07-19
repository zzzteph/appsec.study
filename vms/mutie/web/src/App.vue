<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, load, appList } from './lib/store'
import AppBlock from './views/AppBlock.vue'
import DevConsole from './views/DevConsole.vue'
import AuthPanel from './views/AuthPanel.vue'

// Selection state: 'dev' opens the API console; anything else is a view.id from the manifest
const selected = ref('dev')
const drawerOpen = ref(false)
const search = ref('')

const current = computed(() => state.byId[selected.value] || null)
const grouped = computed(() => {
  const q = search.value.trim().toLowerCase()
  const apps = Object.keys(state.byApp).sort()
  return apps.map(app => {
    const items = state.byApp[app].filter(v => !q || v.title.toLowerCase().includes(q) || v.slug.toLowerCase().includes(q))
    return { app, items }
  }).filter(g => g.items.length)
})

const APP_LABELS = {
  blog: 'Journal', news: 'Newsroom', paste: 'Snippets', chat: 'Rooms',
  shop: 'Store', social: 'Community', account: 'Account', partner: 'Partners',
  admin: 'Admin', platform: 'Platform',
}
function labelFor(app) { return APP_LABELS[app] || app.charAt(0).toUpperCase() + app.slice(1) }
function iconFor(app) {
  return { blog: '📓', news: '📰', paste: '📎', chat: '💬', shop: '🛒', social: '👥',
           account: '👤', partner: '🤝', admin: '⚙️', platform: '🧩' }[app] || '📁'
}

function go(id) { selected.value = id; drawerOpen.value = false; window.scrollTo(0, 0) }

onMounted(async () => {
  await load()
  // default to the first non-admin content-y block if there is one
  const first = state.views.find(v => !v.admin) || state.views[0]
  if (first) selected.value = first.id
})
</script>

<template>
  <div class="shell" v-if="state.ready">
    <header class="appbar">
      <button class="hamburger" @click="drawerOpen = !drawerOpen" aria-label="menu">☰</button>
      <span class="brand"><span class="logo">◐</span> mutie</span>
      <span class="chip gen" v-if="state.manifest">gen {{ state.manifest.generation }} · {{ state.manifest.api }} · {{ state.manifest.auth }}</span>
      <span class="spacer"></span>
      <AuthPanel />
    </header>

    <aside class="drawer" :class="{ open: drawerOpen }">
      <div class="dh">◐ mutie</div>
      <div class="drawer-search">
        <input class="field" v-model="search" placeholder="Search sections…" />
      </div>
      <div class="drawer-section" v-for="g in grouped" :key="g.app">
        <div class="dgh">{{ iconFor(g.app) }} {{ labelFor(g.app) }}</div>
        <a v-for="v in g.items" :key="v.id" :class="{ on: selected === v.id }" @click="go(v.id)">
          <span>{{ v.title }}</span>
          <span class="d-slug">/{{ v.slug }}</span>
        </a>
      </div>
      <div class="drawer-section">
        <div class="dgh">🛠 Tools</div>
        <a :class="{ on: selected === 'dev' }" @click="go('dev')">Developer</a>
      </div>
    </aside>
    <div class="scrim" v-if="drawerOpen" @click="drawerOpen = false"></div>

    <main>
      <DevConsole v-if="selected === 'dev'" />
      <AppBlock v-else-if="current" :view="current" />
      <p v-else class="muted">Select a section from the navigation.</p>
    </main>
  </div>
  <div v-else class="loading">
    <p class="muted" v-if="!state.err">Loading…</p>
    <p class="err" v-else>Failed to load manifest: {{ state.err }}</p>
  </div>
</template>
