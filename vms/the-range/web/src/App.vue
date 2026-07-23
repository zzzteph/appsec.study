<script setup>
import { ref, onMounted, computed } from 'vue'
import { logo } from './art'
const challenges = ref([]); const flags = ref(''); const report = ref(null); const busy = ref(false)
onMounted(async () => { challenges.value = await (await fetch('/api/challenges')).json() })
async function score() {
  busy.value = true
  const list = flags.value.split(/\s+/).map(s => s.trim()).filter(Boolean)
  try { report.value = await (await fetch('/api/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flags: list }) })).json() }
  finally { busy.value = false }
}
const classEntries = computed(() => report.value ? Object.entries(report.value.by_class) : [])
</script>
<template>
  <div class="topbar">
    <div class="brand"><img :src="logo(30)" /> The Range</div>
    <span class="tag">Scanner Benchmark</span><span class="tag">{{ challenges.length }} challenges</span>
  </div>
  <div class="content">
    <p class="muted">A calibrated set of planted web vulnerabilities — one per class, at graded difficulty. Run your scanner against the endpoints below, collect the <span class="mono">FLAG{…}</span> each exploit reveals, then paste them here to measure coverage.</p>
    <div class="grid">
      <div class="card">
        <h3>Challenges</h3>
        <table><thead><tr><th>#</th><th>Class</th><th>Difficulty</th><th>Endpoint</th></tr></thead>
          <tbody><tr v-for="c in challenges" :key="c.id"><td>{{ c.id }}</td><td>{{ c.class }}</td><td><span class="badge" :class="c.difficulty.split('-')[0]">{{ c.difficulty }}</span></td><td class="mono">{{ c.endpoint }}</td></tr></tbody></table>
      </div>
      <div class="card">
        <h3>Score</h3>
        <p class="muted" style="font-size:13px">Paste the flags your scanner found (one per line).</p>
        <textarea v-model="flags" placeholder="FLAG{range-sqli-...}&#10;FLAG{range-idor-...}"></textarea>
        <button class="btn" style="margin-top:10px;width:100%" :disabled="busy" @click="score">Score coverage</button>
        <template v-if="report">
          <div style="text-align:center;margin:16px 0"><div class="big">{{ report.coverage_pct }}%</div><div class="muted">{{ report.score }} / {{ report.total }} found</div>
            <div class="meter" style="margin-top:8px"><div :style="{ width: report.coverage_pct + '%' }"></div></div></div>
          <h4 style="margin:12px 0 6px">By class</h4>
          <div v-for="[k,v] in classEntries" :key="k" class="classrow"><span style="width:130px">{{ k }}</span><div class="meter m"><div :style="{ width: (v.found/v.total*100) + '%' }"></div></div><span :class="v.found?'found':'miss'">{{ v.found }}/{{ v.total }}</span></div>
          <div v-if="report.missed.length" style="margin-top:12px"><h4 style="margin:0 0 6px">Missed ({{ report.missed.length }})</h4>
            <div v-for="m in report.missed" :key="m.id" class="row2"><span class="miss">#{{ m.id }} {{ m.class }}</span><span class="mono muted">{{ m.hint }}</span></div></div>
          <div v-if="report.invalid_flags.length" class="muted" style="margin-top:10px;font-size:12px">Ignored {{ report.invalid_flags.length }} invalid flag(s).</div>
        </template>
      </div>
    </div>
  </div>
</template>
