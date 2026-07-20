<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const eps = computed(()=> (props.view.endpoints||[]).length)

</script>
<template>
<section class="blk card pad">
  <div class="blk-h">Overview</div>
  <div class="metrics">
    <div class="card metric"><div class="n">{{ eps }}</div><div class="l">endpoints</div></div>
    <div class="card metric"><div class="n">{{ view.uiVariant }}</div><div class="l">variant</div></div>
    <div class="card metric"><div class="n">{{ (state.manifest&&state.manifest.auth)||'—' }}</div><div class="l">auth</div></div>
  </div>
</section>
</template>
