<script setup>
// fileportal kind — read files (GET /file?name=…) and optionally upload/run extensions.
import { ref } from 'vue'
import { apiGet, apiPost, findEndpoint, fillPath } from '../lib/store'

const props = defineProps({ view: Object, layout: Number, widget: String })
const name = ref('welcome.txt'); const content = ref(''); const err = ref('')
const upName = ref('note.txt'); const upContent = ref(''); const runName = ref(''); const runOutput = ref(null)

async function read() {
  const ep = findEndpoint(props.view, 'read'); if (!ep) return
  const r = await apiGet(ep.p + '?name=' + encodeURIComponent(name.value))
  content.value = r.text; err.value = r.ok ? '' : r.text
}
async function upload() {
  const ep = findEndpoint(props.view, 'upload'); if (!ep) return
  const r = await apiPost(ep.p, { filename: upName.value, content: upContent.value })
  err.value = r.ok ? '' : (r.data && r.data.error) || 'upload failed'
}
async function run() {
  const ep = findEndpoint(props.view, 'run'); if (!ep) return
  const r = await apiPost(fillPath(ep.p, { name: runName.value || upName.value }), {})
  runOutput.value = r.data
}
</script>
<template>
<div>
  <div v-if="layout === 0 || layout === 2" class="grid" style="grid-template-columns: 1fr 1fr; gap:1rem">
    <div class="card pad">
      <b>Read a file</b>
      <label class="lbl">Name</label>
      <input class="field" v-model="name" />
      <button class="btn" @click="read">Open</button>
      <pre class="out" v-if="content">{{ content }}</pre>
      <pre class="err" v-if="err">{{ err }}</pre>
    </div>
    <div class="card pad" v-if="(view.endpoints || []).some(e => e.kind === 'upload')">
      <b>Upload extension</b>
      <label class="lbl">Filename</label><input class="field" v-model="upName" />
      <label class="lbl">Content</label>
      <textarea class="field" rows="6" v-model="upContent"></textarea>
      <button class="btn" @click="upload">Upload</button>
      <hr />
      <label class="lbl">Run by name</label><input class="field" v-model="runName" :placeholder="upName" />
      <button class="btn accent" @click="run">Run</button>
      <pre class="out" v-if="runOutput">{{ JSON.stringify(runOutput, null, 2) }}</pre>
    </div>
  </div>

  <div v-else-if="layout === 1">
    <div class="card pad">
      <b>Document viewer</b>
      <div class="row">
        <input class="field" v-model="name" placeholder="e.g. welcome.txt" />
        <button class="btn" @click="read">Open</button>
      </div>
      <pre class="out" v-if="content">{{ content }}</pre>
      <pre class="err" v-if="err">{{ err }}</pre>
    </div>
    <div class="card pad" style="margin-top:1rem" v-if="(view.endpoints || []).some(e => e.kind === 'upload')">
      <b>Upload &amp; run</b>
      <label class="lbl">Filename</label><input class="field" v-model="upName" />
      <label class="lbl">Content</label>
      <textarea class="field" rows="4" v-model="upContent"></textarea>
      <div class="row"><button class="btn" @click="upload">Save</button><button class="btn accent" @click="run">Execute</button></div>
      <pre class="out" v-if="runOutput">{{ JSON.stringify(runOutput, null, 2) }}</pre>
    </div>
  </div>

  <div v-else-if="layout === 3">
    <div class="card pad">
      <div class="tool-grid">
        <div>
          <b>Docs</b>
          <div class="row"><input class="field" v-model="name" /><button class="btn flat" @click="read">Fetch</button></div>
          <pre class="out" v-if="content">{{ content }}</pre>
          <pre class="err" v-if="err">{{ err }}</pre>
        </div>
        <div v-if="(view.endpoints || []).some(e => e.kind === 'upload')">
          <b>Extensions</b>
          <input class="field" v-model="upName" placeholder="ext.js" />
          <textarea class="field" rows="4" v-model="upContent" placeholder="module.exports = () => 'hello'"></textarea>
          <div class="row"><button class="btn" @click="upload">Upload</button><input class="field" v-model="runName" :placeholder="upName" /><button class="btn accent" @click="run">Run</button></div>
          <pre class="out" v-if="runOutput">{{ JSON.stringify(runOutput, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>

  <div v-else>
    <div class="card pad">
      <b>File explorer</b>
      <div class="row">
        <input class="field" v-model="name" placeholder="path" />
        <button class="btn" @click="read">Read</button>
      </div>
      <pre class="out" v-if="content">{{ content }}</pre>
      <pre class="err" v-if="err">{{ err }}</pre>
      <details v-if="(view.endpoints || []).some(e => e.kind === 'upload')">
        <summary>Upload/Run</summary>
        <input class="field" v-model="upName" />
        <textarea class="field" rows="4" v-model="upContent"></textarea>
        <div class="row"><button class="btn" @click="upload">Upload</button><button class="btn accent" @click="run">Run</button></div>
        <pre class="out" v-if="runOutput">{{ JSON.stringify(runOutput, null, 2) }}</pre>
      </details>
    </div>
  </div>
</div>
</template>
