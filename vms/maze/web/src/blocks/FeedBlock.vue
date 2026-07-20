<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const posts = ref([]); const title = ref(''); const body = ref('')
const listEp = computed(()=> (props.view.endpoints||[]).find(e=> e.kind==='list' && e.p.endsWith('/posts')))
const composeEp = computed(()=> findEndpoint(props.view,'compose'))
async function load(){ if(listEp.value){ const r = await apiGet(listEp.value.p); if(Array.isArray(r.data)) posts.value=r.data } }
async function post(){ if(!composeEp.value) return; await apiPost(composeEp.value.p,{title:title.value,body:body.value}); title.value=body.value=''; load() }
onMounted(load)

</script>
<template>
<section class="blk card pad" v-if="listEp || composeEp">
  <div class="blk-h">Feed</div>
  <div v-if="composeEp" class="compose"><input class="field" v-model="title" placeholder="Title" /><textarea class="field" rows="2" v-model="body" placeholder="Say something…"></textarea><button class="btn accent" @click="post">Post</button></div>
  <div class="coll feed"><div class="card post" v-for="p in posts" :key="p.id"><div class="head"><img :src="avatar(p.title||('u'+p.id))" /><b>{{ p.title||'anon' }}</b></div><div class="body" v-html="p.body"></div></div></div>
</section>
</template>
<style scoped>.post .head{display:flex;align-items:center;gap:.5rem;padding:.4rem 0}.post .head img{width:32px;height:32px;border-radius:50%}.post .body{padding:.3rem 0}</style>
