<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const job = ref('{}'); const out = ref(null)
const ep = computed(()=> findEndpoint(props.view,'import-job'))
async function run(){ const r=await apiPost(ep.value.p,{job:job.value}); out.value=r.data }

</script>
<template>
<section class="blk card pad" v-if="ep">
  <div class="blk-h">Job import</div>
  <textarea class="field mono" rows="3" v-model="job"></textarea><button class="btn accent" @click="run">Import</button>
  <pre class="out" v-if="out">{{ JSON.stringify(out,null,2) }}</pre>
</section>
</template>
