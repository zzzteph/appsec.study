<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../api'
const router = useRouter()
const notes = ref([]); const nn = ref({ title: '', body: '', private: false }); const toast = ref(null)
const filter = ref('{"title":{"$regex":"list"}}'); const results = ref(null); const err = ref('')
async function load() { notes.value = await get('/notes') }
onMounted(load)
async function create() { if (!nn.value.title) return; await post('/notes', nn.value); nn.value = { title: '', body: '', private: false }; await load(); toast.value = 'Note saved'; setTimeout(() => toast.value = null, 1600) }
async function search() { err.value = ''; results.value = null; try { const f = JSON.parse(filter.value); results.value = (await post('/notes/search', { filter: f })).results } catch (e) { err.value = e.message } }
</script>
<template>
  <div class="content">
    <div class="row" style="margin-bottom:16px"><h1 style="margin:0">My Notes</h1></div>
    <div class="grid g2" style="align-items:start;margin-bottom:18px">
      <div class="grid g2">
        <div v-for="n in notes" :key="n._id" class="note" @click="router.push('/note/' + n._id)">
          <span v-if="n.private" class="lock">🔒</span><h4>{{ n.title }}</h4><div class="muted" style="font-size:13px">{{ n.body }}</div>
        </div>
      </div>
      <div class="card">
        <h3>New note</h3>
        <div class="field"><label>Title</label><input v-model="nn.title" /></div>
        <div class="field"><label>Body</label><textarea v-model="nn.body"></textarea></div>
        <label class="row" style="font-size:13px;gap:8px"><input type="checkbox" v-model="nn.private" style="width:auto" /> Private</label>
        <button class="btn primary" style="margin-top:10px" @click="create">Save</button>
      </div>
    </div>
    <div class="card">
      <h3>Advanced search</h3>
      <p class="muted" style="font-size:13px">Query your notes with a MongoDB filter (JSON).</p>
      <input v-model="filter" class="mono" style="width:100%" />
      <button class="btn" style="margin-top:8px" @click="search">Search</button>
      <div v-if="err" class="err-inline" style="margin-top:8px">{{ err }}</div>
      <table v-if="results" style="margin-top:10px"><thead><tr><th>Owner</th><th>Title</th><th>Body</th></tr></thead>
        <tbody><tr v-for="r in results" :key="r._id"><td>{{ r.owner }}</td><td>{{ r.title }}</td><td>{{ r.body }}</td></tr></tbody></table>
    </div>
    <div v-if="toast" class="toast ok">{{ toast }}</div>
  </div>
</template>
