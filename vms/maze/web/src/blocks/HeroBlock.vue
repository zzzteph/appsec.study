<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const id = String(props.view.id)

</script>
<template>
<section class="blk hero">
  <img :src="photo(id + '-hero', 1400, 300)" />
  <div class="cap"><h1>{{ view.title }}</h1><p class="muted">{{ view.app }} · {{ view.kind }}</p></div>
</section>
</template>
<style scoped>.hero{position:relative;border-radius:12px;overflow:hidden;box-shadow:var(--e2);color:#fff;margin:0}.hero img{width:100%;height:220px;object-fit:cover;filter:brightness(.55)}.hero .cap{position:absolute;left:0;bottom:0;padding:1.2rem 1.5rem}.hero h1{margin:0;font-weight:500;font-size:1.8rem}</style>
