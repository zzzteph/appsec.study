<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const id = ref(1); const detail = ref(null); const err = ref('')
const ep = computed(()=> findEndpoint(props.view,'detail'))
async function open(){ if(!ep.value) return; const r = await apiGet(fillPath(ep.value.p,{id:id.value})); detail.value=r.data; err.value=r.ok?'':'not found' }

</script>
<template>
<section class="blk card pad" v-if="ep">
  <div class="blk-h">Item lookup</div>
  <div class="row"><input class="field" v-model="id" style="width:120px" /><button class="btn flat" @click="open">Open</button></div>
  <pre class="err" v-if="err">{{ err }}</pre>
  <pre class="out" v-if="detail">{{ JSON.stringify(detail,null,2) }}</pre>
</section>
</template>
