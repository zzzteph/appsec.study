<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const url = ref('https://example.com/'); const method = ref('GET'); const body = ref(''); const out = ref(null); const err = ref('')
const ep = computed(()=> findEndpoint(props.view,'fetch'))
async function send(){ const r=await apiPost(ep.value.p,{url:url.value,method:method.value,body:body.value}); out.value=r.data; err.value=r.ok?'':(r.data&&r.data.error)||'error' }

</script>
<template>
<section class="blk card pad" v-if="ep">
  <div class="blk-h">Webhook / URL tester</div>
  <div class="row"><input class="field" v-model="url" style="flex:1" /><select class="field" v-model="method" style="width:100px"><option>GET</option><option>POST</option></select><button class="btn accent" @click="send">Send</button></div>
  <textarea class="field mono" rows="2" v-model="body" placeholder="body"></textarea>
  <pre class="err" v-if="err">{{ err }}</pre>
  <pre class="out" v-if="out">{{ JSON.stringify(out,null,2) }}</pre>
</section>
</template>
