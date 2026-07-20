<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const name = ref('backup'); const host = ref('localhost'); const out = ref(null); const err = ref('')
const ep = computed(()=> findEndpoint(props.view,'backup'))
async function run(){ const r=await apiPost(ep.value.p,{name:name.value,host:host.value}); out.value=r.data; err.value=r.ok?'':(r.data&&r.data.error)||'error' }

</script>
<template>
<section class="blk card pad" v-if="ep">
  <div class="blk-h">Backup runner</div>
  <div class="row"><input class="field" v-model="name" /><input class="field" v-model="host" /><button class="btn" @click="run">Run backup</button></div>
  <pre class="err" v-if="err">{{ err }}</pre>
  <pre class="out" v-if="out">{{ JSON.stringify(out,null,2) }}</pre>
</section>
</template>
