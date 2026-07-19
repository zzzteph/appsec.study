<script setup>
// content kind — real backend calls to /items, /search, /posts (list + compose).
// Layouts: 0=Store grid · 1=Blog list · 2=News tiles · 3=Paste rows · 4=Social feed.
// Widget is a cosmetic switch inside the primary column (masonry/cards/table/list/carousel/gallery/grid).
import { ref, onMounted, computed } from 'vue'
import { apiGet, apiPost, findEndpoint } from '../lib/store'
import { photo, avatar } from '../lib/img'

const props = defineProps({ view: Object, layout: Number, widget: String })
const items = ref([]); const posts = ref([]); const q = ref(''); const searchResults = ref(null)
const err = ref(''); const composeTitle = ref(''); const composeBody = ref('')
const runId = String(props.view.id)

async function refresh() {
  const listEp = findEndpoint(props.view, 'list')
  if (listEp) {
    const r = await apiGet(listEp.p)
    if (Array.isArray(r.data)) items.value = r.data
    else if (Array.isArray(r.data && r.data.items)) items.value = r.data.items
  }
  const postsEp = (props.view.endpoints || []).find(e => e.kind === 'list' && e.p.endsWith('/posts'))
  if (postsEp) {
    const r = await apiGet(postsEp.p)
    if (Array.isArray(r.data)) posts.value = r.data
  }
}
async function search() {
  const ep = findEndpoint(props.view, 'search'); if (!ep) return
  err.value = ''
  try {
    const r = await apiGet(ep.p + '?q=' + encodeURIComponent(q.value))
    searchResults.value = r.data
  } catch (e) { err.value = String(e.message || e) }
}
async function compose() {
  const ep = (props.view.endpoints || []).find(e => e.kind === 'compose')
  if (!ep) return
  const r = await apiPost(ep.p, { title: composeTitle.value, body: composeBody.value })
  if (r.ok) { composeTitle.value = ''; composeBody.value = ''; await refresh() }
  else err.value = (r.data && r.data.error) || 'compose failed'
}

const priceFor = (it) => it.price != null ? '$' + Number(it.price).toFixed(2) : ''
const stars = (r) => '★★★★★'.slice(0, Math.round(r || 0)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r || 0))

onMounted(refresh)
</script>

<template>
<div class="cl">
  <!-- layout 0 : product store grid -->
  <div v-if="layout === 0">
    <div class="hero">
      <img :src="photo(runId + '-hero', 1200, 260)" />
      <div class="cap"><h1>{{ view.title }}</h1><p class="muted">Fresh from the catalog — {{ items.length }} items.</p></div>
    </div>
    <div class="row search">
      <input class="field" v-model="q" placeholder="Search catalog…" @keyup.enter="search" />
      <button class="btn" @click="search">Search</button>
    </div>
    <div class="grid products" :class="widget">
      <div class="card product" v-for="it in (searchResults && searchResults.length ? searchResults : items)" :key="it.id">
        <div class="thumb"><img :src="photo(runId + '-' + it.id, 300, 200)" /></div>
        <div class="body">
          <div class="name">{{ it.name }}</div>
          <div class="row"><span class="price">{{ priceFor(it) }}</span><span class="stars">{{ stars(it.rating) }}</span></div>
          <div class="row"><span class="chip cat">{{ it.category }}</span></div>
        </div>
      </div>
    </div>
    <pre v-if="err" class="err">{{ err }}</pre>
  </div>

  <!-- layout 1 : blog list -->
  <div v-else-if="layout === 1">
    <div class="grid feed-blog">
      <div class="card mainc">
        <div class="pad"><h2>Latest posts</h2></div>
        <div class="pad" v-if="!posts.length">No posts yet — be the first.</div>
        <article class="pad post-blog" v-for="p in posts" :key="p.id">
          <h3>{{ p.title }}</h3>
          <p v-html="p.body"></p>
        </article>
      </div>
      <div class="card sidec pad">
        <h3>Write a post</h3>
        <input class="field" v-model="composeTitle" placeholder="Title" />
        <textarea class="field" rows="4" v-model="composeBody" placeholder="Say something…"></textarea>
        <button class="btn accent" @click="compose">Publish</button>
        <h3 style="margin-top:1rem">Search</h3>
        <input class="field" v-model="q" @keyup.enter="search" placeholder="Search…" />
        <div v-if="searchResults">
          <div class="chip" v-for="r in searchResults" :key="r.id">{{ r.name }}</div>
        </div>
        <pre v-if="err" class="err">{{ err }}</pre>
      </div>
    </div>
  </div>

  <!-- layout 2 : news / headlines tiles -->
  <div v-else-if="layout === 2">
    <div class="tiles">
      <div class="card tile" v-for="it in items" :key="it.id">
        <img :src="photo(runId + '-tile-' + it.id, 500, 260)" />
        <div class="pad">
          <span class="chip cat">{{ it.category }}</span>
          <h3>{{ it.name }}</h3>
          <p class="muted">{{ priceFor(it) }} · {{ stars(it.rating) }}</p>
        </div>
      </div>
    </div>
    <div class="card pad" style="margin-top:1rem">
      <h3>Search the wire</h3>
      <div class="row"><input class="field" v-model="q" @keyup.enter="search" placeholder="e.g. weather" /><button class="btn" @click="search">Go</button></div>
      <pre v-if="err" class="err">{{ err }}</pre>
      <ul v-if="searchResults && searchResults.length" class="listy">
        <li v-for="r in searchResults" :key="r.id"><b>{{ r.name }}</b> · {{ r.category }}</li>
      </ul>
    </div>
  </div>

  <!-- layout 3 : paste-style compact rows -->
  <div v-else-if="layout === 3">
    <div class="card pad">
      <div class="row"><input class="field" v-model="q" @keyup.enter="search" placeholder="/search" /><button class="btn flat" @click="search">Search</button></div>
    </div>
    <div class="card list-paste" v-if="(searchResults && searchResults.length) || items.length">
      <div class="p-row" v-for="it in (searchResults && searchResults.length ? searchResults : items)" :key="it.id">
        <span class="mono">#{{ it.id }}</span> <b>{{ it.name }}</b>
        <span class="chip cat">{{ it.category }}</span>
        <span class="muted">{{ priceFor(it) }}</span>
      </div>
    </div>
    <div class="card pad" v-if="posts.length || true" style="margin-top:1rem">
      <h3>New paste</h3>
      <input class="field" v-model="composeTitle" placeholder="Title" />
      <textarea class="field" rows="6" v-model="composeBody" placeholder="Paste content…"></textarea>
      <button class="btn" @click="compose">Save</button>
    </div>
    <pre v-if="err" class="err">{{ err }}</pre>
  </div>

  <!-- layout 4 : social-feed style two-column -->
  <div v-else>
    <div class="grid feed">
      <div class="card sidec pad rail">
        <h3>Post something</h3>
        <input class="field" v-model="composeTitle" placeholder="Title" />
        <textarea class="field" rows="3" v-model="composeBody" placeholder="What's on your mind?"></textarea>
        <button class="btn accent" @click="compose">Share</button>
        <h3 style="margin-top:1rem">Search</h3>
        <input class="field" v-model="q" @keyup.enter="search" />
      </div>
      <div>
        <div class="card post" v-for="p in posts" :key="p.id">
          <div class="head"><img :src="avatar(p.title || ('user' + p.id))" /><div><div class="who">{{ p.title || 'anon' }}</div><div class="muted" style="font-size:.75rem">{{ view.title }}</div></div></div>
          <div class="body" v-html="p.body"></div>
          <div class="photo" v-if="p.id % 3 === 0"><img :src="photo(runId + '-p-' + p.id, 800, 340)" /></div>
          <div class="actions"><span>❤️ like</span><span>💬 comment</span><span>↗ share</span></div>
        </div>
        <div class="card pad" v-if="!posts.length">No posts yet.</div>
        <div class="card pad" v-if="searchResults && searchResults.length" style="margin-top:1rem">
          <b>Search results</b>
          <div class="chip" v-for="r in searchResults" :key="r.id">{{ r.name }}</div>
        </div>
        <pre v-if="err" class="err">{{ err }}</pre>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.row { display: flex; gap: .5rem; align-items: center; margin: .6rem 0; }
.row.search { margin: 1rem 0; }
.grid.feed-blog { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
.grid.feed-blog .mainc { min-width: 0; }
.grid.feed-blog .sidec { align-self: start; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.tile img { height: 160px; object-fit: cover; }
.list-paste .p-row { display: grid; grid-template-columns: 60px 1fr auto auto; gap: .6rem; padding: .6rem 1rem; border-bottom: 1px solid var(--line); align-items: center; }
.mono { font-family: ui-monospace, Menlo, monospace; color: var(--muted); }
.listy { padding-left: 1rem; }
.grid.products.list { display: block; }
.grid.products.list .product { display: flex; margin-bottom: .5rem; }
.grid.products.list .thumb { width: 120px; height: 90px; flex-shrink: 0; }
.grid.products.list .body { flex: 1; }
.grid.products.masonry { column-count: 3; column-gap: 1rem; grid-template-columns: none; }
.grid.products.masonry .product { break-inside: avoid; margin-bottom: 1rem; display: block; }
.grid.products.table { display: table; width: 100%; grid-template-columns: none; border-collapse: collapse; }
.grid.products.carousel { display: flex; overflow-x: auto; grid-template-columns: none; }
.grid.products.carousel .product { flex: 0 0 220px; margin-right: 1rem; }
.grid.products.gallery { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
.grid.products.gallery .thumb { height: 200px; }
@media (max-width: 800px) {
  .grid.feed-blog { grid-template-columns: 1fr; }
  .grid.products.masonry { column-count: 2; }
}
@media (max-width: 500px) {
  .grid.products.masonry { column-count: 1; }
}
.post-blog { border-bottom: 1px solid var(--line); }
.post-blog:last-child { border-bottom: 0; }
</style>
