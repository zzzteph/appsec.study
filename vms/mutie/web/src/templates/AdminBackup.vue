<script setup>
// adminbackup kind — POST /backup { name } and optionally /import-job.
import { ref } from 'vue'
import { apiPost, findEndpoint } from '../lib/store'

const props = defineProps({ view: Object, layout: Number, widget: String })
const name = ref('nightly'); const output = ref(null); const err = ref(''); const job = ref('{}')

async function run() {
  const ep = findEndpoint(props.view, 'backup'); if (!ep) return
  const r = await apiPost(ep.p, { name: name.value }); output.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
}
async function importJob() {
  const ep = findEndpoint(props.view, 'import-job'); if (!ep) return
  const r = await apiPost(ep.p, { job: job.value }); output.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
}
</script>
<template>
<div>
  <div v-if="layout === 0">
    <div class="metrics"><div class="card metric"><div class="n">3</div><div class="l">jobs today</div></div><div class="card metric"><div class="n">7d</div><div class="l">retention</div></div><div class="card metric"><div class="n">🟢</div><div class="l">healthy</div></div></div>
    <div class="tool-grid" style="margin-top:1rem">
      <div class="card pad"><b>Run backup</b><input class="field" v-model="name" /><button class="btn accent" @click="run">Start</button></div>
      <div class="card pad" v-if="(view.endpoints || []).some(e => e.kind === 'import-job')"><b>Import job</b><textarea class="field" rows="4" v-model="job"></textarea><button class="btn" @click="importJob">Import</button></div>
    </div>
    <div class="card pad" style="margin-top:1rem" v-if="output"><pre class="out">{{ JSON.stringify(output, null, 2) }}</pre></div>
    <pre class="err" v-if="err">{{ err }}</pre>
  </div>
  <div v-else-if="layout === 1" class="card pad">
    <b>Ops runbook</b>
    <label class="lbl">Backup name</label><input class="field" v-model="name" />
    <button class="btn" @click="run">Backup now</button>
    <hr v-if="(view.endpoints || []).some(e => e.kind === 'import-job')" />
    <div v-if="(view.endpoints || []).some(e => e.kind === 'import-job')">
      <b>Import a saved job</b>
      <textarea class="field" rows="5" v-model="job"></textarea>
      <button class="btn accent" @click="importJob">Import</button>
    </div>
    <pre class="out" v-if="output">{{ JSON.stringify(output, null, 2) }}</pre>
    <pre class="err" v-if="err">{{ err }}</pre>
  </div>
  <div v-else-if="layout === 2">
    <div class="card">
      <div class="pad"><b>Scheduled jobs</b></div>
      <table class="data">
        <thead><tr><th>Name</th><th>Last run</th><th></th></tr></thead>
        <tbody>
          <tr><td>{{ name }}</td><td>—</td><td><button class="btn flat" @click="run">Run</button></td></tr>
        </tbody>
      </table>
      <div class="pad"><input class="field" v-model="name" /></div>
    </div>
    <div class="card pad" style="margin-top:1rem" v-if="(view.endpoints || []).some(e => e.kind === 'import-job')">
      <b>Import job</b>
      <textarea class="field" rows="3" v-model="job"></textarea>
      <button class="btn" @click="importJob">Import</button>
    </div>
    <pre class="out" v-if="output">{{ JSON.stringify(output, null, 2) }}</pre>
    <pre class="err" v-if="err">{{ err }}</pre>
  </div>
  <div v-else-if="layout === 3">
    <div class="card pad">
      <div class="row"><input class="field" v-model="name" /><button class="btn accent" @click="run">Backup</button></div>
      <details v-if="(view.endpoints || []).some(e => e.kind === 'import-job')">
        <summary>Import a job</summary>
        <textarea class="field" rows="4" v-model="job"></textarea>
        <button class="btn" @click="importJob">Import</button>
      </details>
      <pre class="out" v-if="output">{{ JSON.stringify(output, null, 2) }}</pre>
      <pre class="err" v-if="err">{{ err }}</pre>
    </div>
  </div>
  <div v-else>
    <div class="grid" style="grid-template-columns: 1fr 1fr; gap:1rem">
      <div class="card pad">
        <b>Backup</b>
        <input class="field" v-model="name" />
        <button class="btn accent" @click="run">Run backup</button>
      </div>
      <div class="card pad" v-if="(view.endpoints || []).some(e => e.kind === 'import-job')">
        <b>Import</b>
        <textarea class="field" v-model="job" rows="6"></textarea>
        <button class="btn" @click="importJob">Load</button>
      </div>
    </div>
    <div class="card pad" style="margin-top:1rem" v-if="output"><pre class="out">{{ JSON.stringify(output, null, 2) }}</pre></div>
    <pre class="err" v-if="err">{{ err }}</pre>
  </div>
</div>
</template>
