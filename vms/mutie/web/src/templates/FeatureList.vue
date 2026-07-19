<script setup>
// feature/generic kind — the block's real endpoints are GET /list and GET /item/:id, plus optional
// side-primitives (open-redirect /go, price-tamper /checkout). Layouts show the same data as tiles,
// list, gallery, table, or dashboard.
import { ref, onMounted } from 'vue'
import { apiGet, apiPost, findEndpoint, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'

const props = defineProps({ view: Object, layout: Number, widget: String })
const items = ref([]); const detail = ref(null); const err = ref(''); const runId = String(props.view.id)
const total = ref(null); const qty = ref(1); const price = ref(19.99); const redirectUrl = ref('/')

async function load() {
  const ep = findEndpoint(props.view, 'list'); if (!ep) return
  const r = await apiGet(ep.p); if (Array.isArray(r.data)) items.value = r.data
}
async function open(id) {
  const ep = findEndpoint(props.view, 'detail'); if (!ep) return
  const r = await apiGet(fillPath(ep.p, { id }))
  detail.value = r.data
  err.value = r.ok ? '' : (r.data && r.data.error) || 'load failed'
}
async function checkout() {
  const ep = findEndpoint(props.view, 'checkout'); if (!ep) return
  const r = await apiPost(ep.p, { items: [{ price: Number(price.value), qty: Number(qty.value) }] })
  total.value = r.data
}
async function tryRedirect() {
  const ep = findEndpoint(props.view, 'redirect'); if (!ep) return
  window.open(ep.p + '?url=' + encodeURIComponent(redirectUrl.value), '_blank')
}
onMounted(load)
</script>
<template>
<div>
  <!-- 0 : dashboard tiles + detail modal -->
  <div v-if="layout === 0">
    <div class="metrics" style="margin-bottom:1rem">
      <div class="card metric"><div class="n">{{ items.length }}</div><div class="l">items</div></div>
      <div class="card metric"><div class="n">{{ view.endpoints.length }}</div><div class="l">endpoints</div></div>
      <div class="card metric"><div class="n">{{ view.uiVariant }}</div><div class="l">layout</div></div>
    </div>
    <div class="grid tiles">
      <div class="card tile" v-for="it in items" :key="it.id" @click="open(it.id)">
        <img :src="photo(runId + '-fl-' + it.id, 400, 180)" />
        <div class="pad"><b>{{ it.title || 'Item #' + it.id }}</b><div class="muted">tap to inspect</div></div>
      </div>
    </div>
  </div>

  <!-- 1 : list on left, details on right -->
  <div v-else-if="layout === 1" class="split">
    <div class="card">
      <div class="pad"><b>All items</b></div>
      <div class="p-row" v-for="it in items" :key="it.id" @click="open(it.id)" :class="{ on: detail && detail.id === it.id }">
        <img :src="avatar(it.title || String(it.id))" style="width:36px;height:36px;border-radius:50%" />
        <b>{{ it.title || 'Item #' + it.id }}</b>
        <span class="chip">#{{ it.id }}</span>
      </div>
    </div>
    <div class="card pad">
      <template v-if="detail">
        <h3>{{ detail.title || 'Item #' + detail.id }}</h3>
        <pre class="out">{{ JSON.stringify(detail, null, 2) }}</pre>
      </template>
      <p v-else class="muted">Select an item to view details.</p>
      <pre v-if="err" class="err">{{ err }}</pre>
    </div>
  </div>

  <!-- 2 : responsive table -->
  <div v-else-if="layout === 2">
    <div class="card">
      <table class="data">
        <thead><tr><th>ID</th><th>Title</th><th></th></tr></thead>
        <tbody>
          <tr v-for="it in items" :key="it.id" @click="open(it.id)"><td>{{ it.id }}</td><td>{{ it.title || '(unnamed)' }}</td><td><button class="btn flat">View</button></td></tr>
        </tbody>
      </table>
    </div>
    <div class="card pad" v-if="detail" style="margin-top:1rem">
      <b>Detail</b>
      <pre class="out">{{ JSON.stringify(detail, null, 2) }}</pre>
    </div>
    <pre v-if="err" class="err">{{ err }}</pre>
  </div>

  <!-- 3 : gallery grid -->
  <div v-else-if="layout === 3">
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:.8rem">
      <div class="card" v-for="it in items" :key="it.id" @click="open(it.id)" style="cursor:pointer">
        <img :src="photo(runId + '-g-' + it.id, 300, 200)" style="width:100%;height:130px;object-fit:cover" />
        <div class="pad" style="padding:.5rem"><b>{{ it.title || '#' + it.id }}</b></div>
      </div>
    </div>
    <div class="card pad" v-if="detail" style="margin-top:1rem"><pre class="out">{{ JSON.stringify(detail, null, 2) }}</pre></div>
    <pre v-if="err" class="err">{{ err }}</pre>
  </div>

  <!-- 4 : side tools (checkout / go) + list -->
  <div v-else>
    <div class="grid" style="grid-template-columns: 1fr 320px; gap: 1rem;">
      <div class="card">
        <div class="pad"><b>Items ({{ items.length }})</b></div>
        <div class="p-row" v-for="it in items" :key="it.id" @click="open(it.id)"><b>#{{ it.id }}</b> {{ it.title }} <span class="muted">→</span></div>
      </div>
      <div>
        <div class="card pad" v-if="(view.endpoints || []).some(e => e.kind === 'checkout')">
          <b>Checkout</b>
          <label class="lbl">Price</label><input class="field" v-model="price" />
          <label class="lbl">Quantity</label><input class="field" v-model="qty" />
          <button class="btn" @click="checkout">Compute total</button>
          <pre class="out" v-if="total">{{ JSON.stringify(total, null, 2) }}</pre>
        </div>
        <div class="card pad" style="margin-top:1rem" v-if="(view.endpoints || []).some(e => e.kind === 'redirect')">
          <b>Follow link</b>
          <input class="field" v-model="redirectUrl" />
          <button class="btn flat" @click="tryRedirect">Open</button>
        </div>
        <div class="card pad" v-if="detail" style="margin-top:1rem"><pre class="out">{{ JSON.stringify(detail, null, 2) }}</pre></div>
      </div>
    </div>
    <pre v-if="err" class="err">{{ err }}</pre>
  </div>
</div>
</template>

<style scoped>
.p-row { display: grid; grid-template-columns: 40px 1fr auto; gap: .6rem; padding: .55rem 1rem; border-bottom: 1px solid var(--line); align-items: center; cursor: pointer; }
.p-row.on { background: #eef0fb; }
.p-row:last-child { border-bottom: 0; }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 800px) { .split { grid-template-columns: 1fr; } }
</style>
