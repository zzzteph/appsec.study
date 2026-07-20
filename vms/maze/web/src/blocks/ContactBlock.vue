<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const name = ref(''); const msg = ref(''); const out = ref(null)
const ep = computed(()=> findEndpoint(props.view,'contact'))
async function send(){ if(ep.value){ const r = await apiPost(ep.value.p,{name:name.value,message:msg.value}); out.value=r.data } else out.value={ok:true} }

</script>
<template>
<section class="blk card pad">
  <div class="blk-h">Contact us</div>
  <input class="field" v-model="name" placeholder="Your name" />
  <textarea class="field" rows="3" v-model="msg" placeholder="Message"></textarea>
  <button class="btn" @click="send">Send</button>
  <pre class="out" v-if="out">{{ JSON.stringify(out,null,2) }}</pre>
</section>
</template>
