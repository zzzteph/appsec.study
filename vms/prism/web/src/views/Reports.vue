<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../api'
const tpl = ref(''); const out = ref(null); const err = ref('')
onMounted(async () => { try { tpl.value = (await get('/reports/template')).template } catch {} })
async function preview() { err.value = ''; out.value = null; try { out.value = await post('/reports/preview', { template: tpl.value }) } catch (e) { err.value = e.message } }
</script>
<template>
  <h1>Report Builder</h1>
  <div class="card">
    <h3>Report template</h3>
    <p class="muted" style="font-size:13px">Design your report layout. Variables: <span class="mono">title, total, rows</span>. Preview renders it with sample data.</p>
    <textarea v-model="tpl" class="mono" style="min-height:120px"></textarea>
    <button class="btn primary" style="margin-top:10px" @click="preview">Preview report</button>
    <div v-if="out" class="result" style="margin-top:12px">{{ out.rendered }}</div>
    <div v-if="err" class="err-inline" style="margin-top:10px">{{ err }}</div>
  </div>
</template>
