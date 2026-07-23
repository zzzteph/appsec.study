<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../api'
const plans = ref([]); const toast = ref(null)
onMounted(async () => { plans.value = await get('/plans') })
async function change(p) { await post('/plans/change', { plan_id: p.id }); toast.value = 'Switched to ' + p.name; setTimeout(() => toast.value = null, 2200) }
</script>
<template>
  <h1>Plans</h1>
  <div class="grid g4">
    <div v-for="p in plans" :key="p.id" class="card">
      <h3 style="margin:0 0 4px">{{ p.name }}</h3>
      <div class="muted" style="font-size:13px;min-height:34px">{{ p.descr }}</div>
      <div style="font-size:22px;font-weight:800;margin:8px 0">${{ p.price }}<span class="muted" style="font-size:13px">/mo</span></div>
      <button class="btn primary sm" style="width:100%" @click="change(p)">Choose</button>
    </div>
  </div>
  <div v-if="toast" class="toast ok">{{ toast }}</div>
</template>
