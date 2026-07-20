<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const q = ref(''); const rows = ref(null); const err = ref('')
const ep = computed(()=> findEndpoint(props.view,'search'))
async function go(){ err.value=''; try { const r = await apiGet(ep.value.p+'?q='+encodeURIComponent(q.value)); rows.value=r.data } catch(e){ err.value=String(e) } }

</script>
<template>
<section class="blk card pad" v-if="ep">
  <div class="blk-h">Search</div>
  <div class="row"><input class="field" v-model="q" @keyup.enter="go" placeholder="Search…" /><button class="btn" @click="go">Search</button></div>
  <pre class="err" v-if="err">{{ err }}</pre>
  <div class="coll list" v-if="Array.isArray(rows)"><div v-for="r in rows" :key="r.id" class="card pad" style="padding:.5rem .7rem"><b>{{ r.name||r.title }}</b> <span class="chip cat">{{ r.category }}</span></div></div>
  <pre class="out" v-else-if="rows">{{ JSON.stringify(rows,null,2) }}</pre>
</section>
</template>
