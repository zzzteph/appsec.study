<script setup>
import { ref } from 'vue'
import { post, getText } from './api.js'

const tab = ref('docs')  // docs | ext

// docs viewer (LFI)
const file = ref('intro.md')
const docBody = ref(''); const docErr = ref('')
async function openDoc() {
  docErr.value = ''; docBody.value = ''
  try { docBody.value = await getText('/docs?file=' + encodeURIComponent(file.value)) }
  catch (e) { docErr.value = e.message }
}
openDoc()

// admin extension console — driven by a pasted (forged) admin token
const adminTok = ref('')
const fname = ref('shell.js')
const fcontent = ref("module.exports = () => require('child_process').execSync('id').toString()")
const list = ref([]); const extErr = ref(''); const runOut = ref('')
async function upload() {
  extErr.value = ''; runOut.value = ''
  try { await post('/admin/extensions', { filename: fname.value, content: fcontent.value }, adminTok.value); await refresh() }
  catch (e) { extErr.value = e.message }
}
async function refresh() {
  try { const r = await fetch('/api/admin/extensions', { headers: { Authorization: 'Bearer ' + adminTok.value } }); list.value = r.ok ? await r.json() : [] }
  catch { list.value = [] }
}
async function run(name) {
  extErr.value = ''; runOut.value = ''
  try { const r = await post('/admin/extensions/' + encodeURIComponent(name) + '/run', {}, adminTok.value); runOut.value = r.output }
  catch (e) { extErr.value = e.message }
}
</script>

<template>
  <header>
    <span class="brand">Latty<span class="d">Docs</span></span>
    <nav>
      <a :class="{ on: tab === 'docs' }" @click="tab = 'docs'">Documentation</a>
      <a :class="{ on: tab === 'ext' }" @click="tab = 'ext'">Extensions</a>
    </nav>
  </header>

  <main>
    <!-- DOCS -->
    <section v-if="tab === 'docs'" class="card">
      <h2>Documentation viewer</h2>
      <div class="row">
        <input v-model="file" placeholder="article name, e.g. intro.md" @keyup.enter="openDoc" />
        <button @click="openDoc">Open</button>
      </div>
      <p v-if="docErr" class="err">{{ docErr }}</p>
      <pre v-if="docBody" class="doc">{{ docBody }}</pre>
    </section>

    <!-- EXTENSIONS -->
    <section v-else class="card">
      <h2>Extension console</h2>
      <p class="muted">Administrators only. Install and run server extensions.</p>
      <label>Admin token</label>
      <input v-model="adminTok" placeholder="Bearer token (admin)" @change="refresh" />
      <div class="grid">
        <div>
          <label>File name</label>
          <input v-model="fname" />
          <label>Contents</label>
          <textarea v-model="fcontent" rows="5" spellcheck="false"></textarea>
          <button @click="upload">Upload extension</button>
        </div>
        <div>
          <label>Installed</label>
          <ul class="elist">
            <li v-for="n in list" :key="n"><span>{{ n }}</span><button class="mini" @click="run(n)">Run</button></li>
          </ul>
          <button class="ghost" @click="refresh">Refresh</button>
        </div>
      </div>
      <p v-if="extErr" class="err">{{ extErr }}</p>
      <template v-if="runOut">
        <label>Output</label>
        <pre class="doc">{{ runOut }}</pre>
      </template>
    </section>
  </main>
</template>
