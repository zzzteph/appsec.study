<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const list = ref([]); const text = ref('')
const getEp = computed(()=> findEndpoint(props.view,'comments'))
const addEp = computed(()=> findEndpoint(props.view,'comment-add'))
async function load(){ if(getEp.value){ const r = await apiGet(getEp.value.p); if(Array.isArray(r.data)) list.value=r.data } }
async function add(){ if(!addEp.value) return; await apiPost(addEp.value.p,{user:'guest',text:text.value}); text.value=''; load() }
onMounted(load)

</script>
<template>
<section class="blk card pad" v-if="getEp">
  <div class="blk-h">Comments</div>
  <div v-for="c in list" :key="c.id" class="cmt"><b>{{ c.user }}</b> <span v-html="c.text"></span></div>
  <div class="row" v-if="addEp"><input class="field" v-model="text" placeholder="Add a comment…" /><button class="btn flat" @click="add">Post</button></div>
</section>
</template>
<style scoped>.cmt{padding:.35rem 0;border-bottom:1px solid var(--line)}</style>
