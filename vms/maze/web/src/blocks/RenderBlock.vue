<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const tpl = ref('Hello {{name}}'); const data = ref('{"name":"world"}'); const out = ref(null); const err = ref('')
const ep = computed(()=> findEndpoint(props.view,'render'))
async function run(){ let d={}; try{ d=JSON.parse(data.value) }catch{} const r=await apiPost(ep.value.p,{template:tpl.value,data:d}); out.value=r.data; err.value=r.ok?'':(r.data&&r.data.error)||'error' }

</script>
<template>
<section class="blk card pad" v-if="ep">
  <div class="blk-h">Report renderer</div>
  <textarea class="field mono" rows="2" v-model="tpl"></textarea><textarea class="field mono" rows="1" v-model="data"></textarea><button class="btn accent" @click="run">Render</button>
  <pre class="err" v-if="err">{{ err }}</pre>
  <pre class="out" v-if="out">{{ JSON.stringify(out,null,2) }}</pre>
</section>
</template>
