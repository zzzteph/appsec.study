<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
import { WIDGETS } from '../widgets'
const items = ref([])
const ep = computed(()=> (props.view.endpoints||[]).find(e=> e.kind==='list' && !e.p.endsWith('/posts')))
const W = computed(()=> WIDGETS[props.widget] || WIDGETS.cards)
const id = String(props.view.id)
const price = (it)=> it.price!=null? '$'+Number(it.price).toFixed(2):''
async function load(){ if(!ep.value) return; const r = await apiGet(ep.value.p); if(Array.isArray(r.data)) items.value=r.data }
onMounted(load)

</script>
<template>
<section class="blk card pad" v-if="ep">
  <div class="blk-h">Catalog <span class="chip">{{ widget }}</span></div>
  <component :is="W" :items="items">
    <template #item="{ item }">
      <div class="card prod"><img v-if="['cards','grid','gallery','masonry','carousel','tiles','feed'].includes(widget)" :src="photo(id+'-'+item.id,320,180)" /><div class="pad" style="padding:.5rem .7rem"><b>{{ item.name||item.title }}</b><div class="muted">{{ item.category }} {{ price(item) }}</div></div></div>
    </template>
  </component>
</section>
</template>
<style scoped>.prod img{width:100%;height:110px;object-fit:cover}</style>
