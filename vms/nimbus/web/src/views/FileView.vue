<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get, post } from '../api'
import { avatar } from '../assets/art'
const route = useRoute()
const meta = ref(null); const content = ref(''); const comments = ref([]); const cbody = ref('')
const shareLink = ref(''); const thumb = ref(''); const xml = ref('<?xml version="1.0"?>\n<note>Hello</note>'); const imported = ref(''); const err = ref('')
async function load() {
  meta.value = await get('/files/' + route.params.id)
  try { content.value = (await get('/files/' + route.params.id + '/content')).content } catch {}
  comments.value = await get('/files/' + route.params.id + '/comments')
}
onMounted(load)
async function addComment() { if (!cbody.value.trim()) return; await post('/files/' + route.params.id + '/comments', { body: cbody.value }); cbody.value = ''; comments.value = await get('/files/' + route.params.id + '/comments') }
async function share() { const d = await post('/files/' + route.params.id + '/share', { permission: 'read' }); shareLink.value = location.origin + '/s/' + d.token }
async function makeThumb() { const d = await post('/files/' + route.params.id + '/thumbnail', { size: '128' }); thumb.value = d.output }
async function runImport() { err.value = ''; imported.value = ''; try { const d = await post('/import', { xml: xml.value }); imported.value = d.imported } catch (e) { err.value = e.message } }
</script>
<template>
  <div v-if="meta">
    <div class="row" style="margin-bottom:6px"><h1 style="margin:0">{{ meta.name }}</h1><span class="badge brand">{{ meta.mime }}</span></div>
    <div class="grid" style="grid-template-columns:1.5fr 1fr;align-items:start;margin-top:14px">
      <div class="card">
        <h3>Preview</h3>
        <div class="result">{{ content }}</div>
        <div class="row" style="margin-top:12px"><button class="btn sm" @click="makeThumb">Generate thumbnail</button><button class="btn sm" @click="share">Create share link</button></div>
        <div v-if="thumb" class="muted mono" style="margin-top:8px;font-size:12px">{{ thumb }}</div>
        <div v-if="shareLink" class="mono" style="margin-top:8px;font-size:12px">{{ shareLink }}</div>
      </div>
      <div class="card">
        <h3>Comments</h3>
        <div v-for="c in comments" :key="c.id" class="comment"><b>{{ c.author_name }}</b> <span class="muted" style="font-size:12px">{{ c.created }}</span><div v-html="c.body"></div></div>
        <div class="row" style="margin-top:10px"><input v-model="cbody" placeholder="Add a comment…" style="flex:1" @keyup.enter="addComment" /><button class="btn primary sm" @click="addComment">Post</button></div>
      </div>
    </div>
    <div class="card" style="margin-top:14px">
      <h3>Import metadata (XML)</h3>
      <p class="muted" style="font-size:13px">Import file metadata from an XML document.</p>
      <textarea v-model="xml" class="mono"></textarea>
      <button class="btn sm" style="margin-top:8px" @click="runImport">Import</button>
      <div v-if="imported" class="result" style="margin-top:8px">{{ imported }}</div>
      <div v-if="err" class="err-inline" style="margin-top:8px">{{ err }}</div>
    </div>
  </div>
</template>
