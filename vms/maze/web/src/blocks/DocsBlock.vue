<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const spec = ref(null); const backup = ref('')
const docEp = computed(()=> findEndpoint(props.view,'docs')); const bkEp = computed(()=> findEndpoint(props.view,'backup-file'))
async function load(){ if(docEp.value){ const r=await apiGet(docEp.value.p); spec.value=r.data } if(bkEp.value){ const r=await apiGet(bkEp.value.p); backup.value=r.text } }
onMounted(load)

</script>
<template>
<section class="blk card pad" v-if="docEp || bkEp">
  <div class="blk-h">API reference</div>
  <pre class="out" v-if="spec">{{ JSON.stringify(spec,null,2) }}</pre>
  <div v-if="backup"><b>Config backup</b><pre class="out">{{ backup }}</pre></div>
</section>
</template>
