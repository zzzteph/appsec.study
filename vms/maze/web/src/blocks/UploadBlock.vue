<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const fn = ref('note.txt'); const content = ref('hello'); const runName = ref(''); const out = ref(null)
const upEp = computed(()=> findEndpoint(props.view,'upload')); const runEp = computed(()=> findEndpoint(props.view,'run'))
async function up(){ const r=await apiPost(upEp.value.p,{filename:fn.value,content:content.value}); out.value=r.data; runName.value=fn.value }
async function run(){ const r=await apiPost(fillPath(runEp.value.p,{name:runName.value}),{}); out.value=r.data }

</script>
<template>
<section class="blk card pad" v-if="upEp">
  <div class="blk-h">Extensions</div>
  <input class="field" v-model="fn" /><textarea class="field mono" rows="2" v-model="content"></textarea><button class="btn" @click="up">Upload</button>
  <div class="row" v-if="runEp"><input class="field" v-model="runName" /><button class="btn flat" @click="run">Run</button></div>
  <pre class="out" v-if="out">{{ JSON.stringify(out,null,2) }}</pre>
</section>
</template>
