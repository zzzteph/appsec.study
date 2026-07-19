<script setup>
// adminupload kind — mirror of the fileportal /ext + /ext/:name/run but presented as admin.
import { ref } from 'vue'
import { apiPost, findEndpoint, fillPath } from '../lib/store'

const props = defineProps({ view: Object, layout: Number, widget: String })
const filename = ref('greeter.js')
const content = ref("module.exports = () => 'hello from ' + require('os').hostname()")
const runName = ref(''); const output = ref(null); const err = ref('')

async function upload() {
  const ep = findEndpoint(props.view, 'upload'); if (!ep) return
  const r = await apiPost(ep.p, { filename: filename.value, content: content.value })
  output.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
}
async function run() {
  const ep = findEndpoint(props.view, 'run'); if (!ep) return
  const r = await apiPost(fillPath(ep.p, { name: runName.value || filename.value }), {})
  output.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
}
</script>
<template>
<div>
  <div v-if="layout === 0" class="grid" style="grid-template-columns:1fr 1fr;gap:1rem">
    <div class="card pad">
      <b>Upload extension</b>
      <label class="lbl">Filename</label><input class="field" v-model="filename" />
      <label class="lbl">Content</label><textarea class="field" rows="8" v-model="content"></textarea>
      <button class="btn" @click="upload">Upload</button>
    </div>
    <div class="card pad">
      <b>Run</b>
      <input class="field" v-model="runName" :placeholder="filename" />
      <button class="btn accent" @click="run">Run</button>
      <pre class="out" v-if="output">{{ JSON.stringify(output, null, 2) }}</pre>
      <pre class="err" v-if="err">{{ err }}</pre>
    </div>
  </div>
  <div v-else class="card pad">
    <b>Extensions manager</b>
    <div class="row"><input class="field" v-model="filename" /><input class="field" v-model="runName" :placeholder="filename" /></div>
    <textarea class="field" rows="8" v-model="content"></textarea>
    <div class="row"><button class="btn" @click="upload">Upload</button><button class="btn accent" @click="run">Execute</button></div>
    <pre class="out" v-if="output">{{ JSON.stringify(output, null, 2) }}</pre>
    <pre class="err" v-if="err">{{ err }}</pre>
  </div>
</div>
</template>
