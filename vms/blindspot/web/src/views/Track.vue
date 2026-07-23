<script setup>
import { ref } from 'vue'
import { get } from '../api'
const code = ref(''); const result = ref(null); const details = ref(null); const err = ref('')
async function check() {
  err.value = ''; result.value = null; details.value = null
  if (!code.value) return
  try {
    result.value = await get('/track?code=' + encodeURIComponent(code.value))
    if (result.value.found) { try { details.value = await get('/track/details?code=' + encodeURIComponent(code.value)) } catch {} }
  } catch (e) { err.value = e.message }
}
</script>
<template>
  <div class="content">
    <div class="hero" style="margin-bottom:22px">
      <h1 style="margin:0 0 6px">Track your shipment</h1>
      <p style="opacity:.85;margin:0 0 16px">Enter a tracking number to see live delivery status.</p>
      <div class="row" style="max-width:520px">
        <input v-model="code" placeholder="e.g. TRK1000001" style="flex:1;background:#fff;color:#1a1204;border:0" @keyup.enter="check" />
        <button class="btn" style="background:#1a1204;color:#f59e0b" @click="check">Track</button>
      </div>
    </div>
    <div v-if="result" class="card">
      <template v-if="result.found">
        <div class="row"><span class="badge ok">Found</span><b class="mono">{{ code }}</b></div>
        <table v-if="details" style="margin-top:12px"><tbody>
          <tr><td class="muted">Status</td><td><b>{{ details.status }}</b></td></tr>
          <tr><td class="muted">Carrier</td><td>{{ details.carrier }}</td></tr>
          <tr><td class="muted">ETA</td><td>{{ details.eta }}</td></tr>
          <tr><td class="muted">Destination</td><td>{{ details.dest }}</td></tr>
        </tbody></table>
      </template>
      <div v-else class="muted">No shipment found for that tracking number.</div>
    </div>
    <div v-if="err" class="err-inline" style="margin-top:12px">{{ err }}</div>
  </div>
</template>
