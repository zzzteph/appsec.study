<script setup>
// webhook kind — POST /fetch { url, method, headers, body } — the SSRF surface + a decent web-fetch UI.
import { ref } from 'vue'
import { apiPost, findEndpoint } from '../lib/store'

const props = defineProps({ view: Object, layout: Number, widget: String })
const url = ref('https://example.com/'); const method = ref('GET'); const hdrs = ref('{}'); const body = ref(''); const result = ref(null); const err = ref('')
const history = ref([])

async function send() {
  const ep = findEndpoint(props.view, 'fetch'); if (!ep) return
  let h = {}; try { h = hdrs.value.trim() ? JSON.parse(hdrs.value) : {} } catch (e) { err.value = 'bad headers JSON'; return }
  const r = await apiPost(ep.p, { url: url.value, method: method.value, headers: h, body: body.value })
  result.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
  history.value.unshift({ ts: new Date().toLocaleTimeString(), url: url.value, method: method.value, status: (r.data && r.data.status) || r.status })
  history.value = history.value.slice(0, 8)
}
</script>
<template>
<div>
  <!-- 0 : classic tester -->
  <div v-if="layout === 0" class="card pad">
    <b>Webhook / URL tester</b>
    <label class="lbl">URL</label><input class="field" v-model="url" />
    <div class="row">
      <select class="field" v-model="method" style="width:120px">
        <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option>
      </select>
      <button class="btn accent" @click="send">Send</button>
    </div>
    <label class="lbl">Headers (JSON)</label>
    <textarea class="field" rows="3" v-model="hdrs" placeholder="{&quot;X-Header&quot;:&quot;value&quot;}"></textarea>
    <label class="lbl">Body</label>
    <textarea class="field" rows="4" v-model="body"></textarea>
    <pre class="err" v-if="err">{{ err }}</pre>
    <pre class="out" v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
  </div>

  <!-- 1 : delivery style w/ history -->
  <div v-else-if="layout === 1" class="grid" style="grid-template-columns: 2fr 1fr; gap:1rem">
    <div class="card pad">
      <b>Send delivery</b>
      <input class="field" v-model="url" placeholder="Endpoint URL" />
      <div class="row"><select class="field" v-model="method" style="width:120px"><option>GET</option><option>POST</option></select><button class="btn" @click="send">Deliver</button></div>
      <label class="lbl">Payload</label>
      <textarea class="field" rows="5" v-model="body"></textarea>
      <label class="lbl">Headers</label>
      <textarea class="field" rows="2" v-model="hdrs"></textarea>
      <pre class="err" v-if="err">{{ err }}</pre>
      <pre class="out" v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
    <div class="card pad">
      <b>Recent</b>
      <ul class="listy" style="padding:0;list-style:none">
        <li v-for="(h,i) in history" :key="i" class="p-row2"><span class="mono">{{ h.ts }}</span><b>{{ h.method }}</b><span class="chip">{{ h.status }}</span><br /><span class="muted">{{ h.url }}</span></li>
      </ul>
    </div>
  </div>

  <!-- 2 : compact one-column -->
  <div v-else-if="layout === 2" class="card pad">
    <b>Outbound fetch</b>
    <div class="row"><input class="field" v-model="url" style="flex:1" /><select class="field" v-model="method" style="width:110px"><option>GET</option><option>POST</option></select><button class="btn accent" @click="send">Go</button></div>
    <textarea class="field" v-model="body" rows="3" placeholder="body (POST)"></textarea>
    <pre class="err" v-if="err">{{ err }}</pre>
    <pre class="out" v-if="result">Status: {{ result.status }}
{{ result.body || JSON.stringify(result, null, 2) }}</pre>
  </div>

  <!-- 3 : "webhook subscriptions" style -->
  <div v-else-if="layout === 3" class="card">
    <div class="pad"><b>Subscriptions</b></div>
    <table class="data">
      <thead><tr><th>Event</th><th>URL</th><th>Method</th><th></th></tr></thead>
      <tbody>
        <tr><td>order.created</td><td>{{ url }}</td><td>{{ method }}</td><td><button class="btn flat" @click="send">Fire</button></td></tr>
        <tr><td>user.updated</td><td>—</td><td>POST</td><td><button class="btn flat" disabled>Off</button></td></tr>
      </tbody>
    </table>
    <div class="pad">
      <input class="field" v-model="url" placeholder="URL" />
      <textarea class="field" rows="2" v-model="body" placeholder="body"></textarea>
      <pre class="err" v-if="err">{{ err }}</pre>
      <pre class="out" v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>

  <!-- 4 : "connectors" cards -->
  <div v-else>
    <div class="grid tiles">
      <div class="card pad">
        <b>HTTPBin</b><p class="muted">A test destination</p>
        <button class="btn flat" @click="url='https://example.com/'">Use example.com</button>
      </div>
      <div class="card pad">
        <b>Local health</b><p class="muted">Bounce a probe</p>
        <button class="btn flat" @click="url='http://127.0.0.1:9000/'">Set localhost</button>
      </div>
    </div>
    <div class="card pad" style="margin-top:1rem">
      <input class="field" v-model="url" />
      <div class="row"><select class="field" v-model="method" style="width:110px"><option>GET</option><option>POST</option></select><button class="btn" @click="send">Send</button></div>
      <textarea class="field" rows="3" v-model="body" placeholder="body"></textarea>
      <pre class="err" v-if="err">{{ err }}</pre>
      <pre class="out" v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</div>
</template>
<style scoped>
.p-row2 { padding: .5rem 0; border-bottom: 1px solid var(--line); }
.p-row2:last-child { border-bottom: 0; }
</style>
