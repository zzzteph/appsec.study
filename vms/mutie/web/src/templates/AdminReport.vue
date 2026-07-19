<script setup>
// adminreport kind — template editor + rendered output. Real POST /render.
import { ref } from 'vue'
import { apiPost, findEndpoint } from '../lib/store'

const props = defineProps({ view: Object, layout: Number, widget: String })
const template = ref('Hello {{name}} — {{message}}')
const data = ref('{"name":"admin","message":"hi"}')
const output = ref(''); const err = ref('')
const preset = [
  { name: 'Weekly digest', tpl: 'Report for {{ week }} — sales: {{ sales }}', data: '{"week":"W42","sales":8400}' },
  { name: 'Welcome mail',  tpl: 'Welcome {{ name }}!\nYour new account is ready.', data: '{"name":"you"}' },
]
function usePreset(p) { template.value = p.tpl; data.value = p.data }

async function render() {
  const ep = findEndpoint(props.view, 'render'); if (!ep) return
  let d = {}; try { d = data.value.trim() ? JSON.parse(data.value) : {} } catch (e) { err.value = 'bad JSON data'; return }
  const r = await apiPost(ep.p, { template: template.value, data: d })
  output.value = (r.data && r.data.output) || r.text; err.value = r.ok ? '' : (r.data && r.data.error) || 'render error'
}
</script>
<template>
<div>
  <div v-if="layout === 0" class="grid" style="grid-template-columns: 1fr 1fr; gap:1rem">
    <div class="card pad">
      <b>Template</b>
      <textarea class="field" rows="10" v-model="template"></textarea>
      <b>Data (JSON)</b>
      <textarea class="field" rows="6" v-model="data"></textarea>
      <button class="btn accent" @click="render">Render</button>
    </div>
    <div class="card pad">
      <b>Output</b>
      <pre class="out">{{ output }}</pre>
      <pre class="err" v-if="err">{{ err }}</pre>
    </div>
  </div>
  <div v-else-if="layout === 1">
    <div class="metrics"><div class="card metric"><div class="n">📝</div><div class="l">reports</div></div><div class="card metric"><div class="n">✉️</div><div class="l">notifications</div></div></div>
    <div class="card pad" style="margin-top:1rem">
      <div class="subtabs"><button v-for="p in preset" :key="p.name" class="on" @click="usePreset(p)">{{ p.name }}</button></div>
      <label class="lbl">Template</label><textarea class="field" rows="6" v-model="template"></textarea>
      <label class="lbl">Data</label><textarea class="field" rows="4" v-model="data"></textarea>
      <button class="btn" @click="render">Preview</button>
      <pre class="out" v-if="output">{{ output }}</pre>
      <pre class="err" v-if="err">{{ err }}</pre>
    </div>
  </div>
  <div v-else-if="layout === 2" class="card pad">
    <b>Report builder</b>
    <textarea class="field" rows="8" v-model="template"></textarea>
    <textarea class="field" rows="4" v-model="data"></textarea>
    <button class="btn" @click="render">Generate</button>
    <div v-if="output" class="card pad" style="margin-top:1rem;background:#fff9c4"><pre>{{ output }}</pre></div>
    <pre class="err" v-if="err">{{ err }}</pre>
  </div>
  <div v-else-if="layout === 3">
    <div class="grid" style="grid-template-columns: 300px 1fr;gap:1rem">
      <div class="card pad"><b>Recent</b><ul class="listy"><li v-for="p in preset" :key="p.name" style="cursor:pointer" @click="usePreset(p)">{{ p.name }}</li></ul></div>
      <div class="card pad">
        <textarea class="field" rows="8" v-model="template"></textarea>
        <textarea class="field" rows="3" v-model="data"></textarea>
        <button class="btn accent" @click="render">Render</button>
        <pre class="out" v-if="output">{{ output }}</pre>
        <pre class="err" v-if="err">{{ err }}</pre>
      </div>
    </div>
  </div>
  <div v-else>
    <div class="card pad">
      <b>Announcement composer</b>
      <textarea class="field" rows="6" v-model="template" placeholder="Hi {{ name }}, ..."></textarea>
      <textarea class="field" rows="3" v-model="data"></textarea>
      <button class="btn" @click="render">Compose</button>
      <pre class="out" v-if="output">{{ output }}</pre>
      <pre class="err" v-if="err">{{ err }}</pre>
    </div>
  </div>
</div>
</template>
