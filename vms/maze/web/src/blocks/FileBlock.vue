<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const name = ref('welcome.txt'); const body = ref(''); const err = ref('')
const ep = computed(()=> findEndpoint(props.view,'read'))
async function read(){ err.value=''; try{ const r=await apiGet(ep.value.p+'?name='+encodeURIComponent(name.value)); body.value=r.text }catch(e){ err.value=String(e) } }

</script>
<template>
<section class="blk card pad" v-if="ep">
  <div class="blk-h">Files</div>
  <div class="row"><input class="field mono" v-model="name" /><button class="btn" @click="read">Read</button></div>
  <pre class="err" v-if="err">{{ err }}</pre>
  <pre class="out" v-if="body">{{ body }}</pre>
</section>
</template>
