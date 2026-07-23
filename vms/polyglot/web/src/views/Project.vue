<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get, post } from '../api'
const route = useRoute()
const project = ref(null); const strings = ref([]); const trans = ref([])
const form = ref({ string_id: '', lang: 'es', value: '' }); const preview = ref(''); const err = ref(''); const toast = ref(null)
async function load() {
  project.value = await get('/projects/' + route.params.id)
  const d = await get('/projects/' + route.params.id + '/strings'); strings.value = d.strings; trans.value = d.translations
  if (strings.value[0]) form.value.string_id = strings.value[0].id
}
onMounted(load)
function transFor(sid) { return trans.value.filter(t => t.string_id === sid) }
async function save() { if (!form.value.value) return; await post('/translations', form.value); form.value.value = ''; await load(); toast.value = 'Translation saved'; setTimeout(() => toast.value = null, 1600) }
async function doPreview() { err.value = ''; preview.value = ''; try { const d = await post('/preview', { value: form.value.value }); preview.value = d.rendered } catch (e) { err.value = e.message } }
</script>
<template>
  <div v-if="project">
    <div class="row" style="margin-bottom:6px"><h1 style="margin:0">{{ project.name }}</h1><span class="badge" :class="project.visibility==='public'?'ok':'brand'">{{ project.visibility }}</span></div>
    <p class="muted">{{ project.description }}</p>
    <div class="grid" style="grid-template-columns:1.5fr 1fr;align-items:start;margin-top:14px">
      <div class="card">
        <h3>Strings</h3>
        <div v-for="s in strings" :key="s.id" class="strrow">
          <div class="strkey">{{ s.key }}</div><div>{{ s.source_text }}</div>
          <div v-for="t in transFor(s.id)" :key="t.lang" class="muted" style="font-size:13px">{{ t.lang }}: {{ t.value }}</div>
        </div>
      </div>
      <div class="card">
        <h3>Translate</h3>
        <div class="field"><label>String</label><select v-model="form.string_id"><option v-for="s in strings" :key="s.id" :value="s.id">{{ s.key }}</option></select></div>
        <div class="field"><label>Language</label><select v-model="form.lang"><option>es</option><option>fr</option><option>de</option><option>ja</option></select></div>
        <div class="field"><label>Translation (placeholders supported)</label><textarea v-model="form.value"></textarea></div>
        <div class="row"><button class="btn" @click="doPreview">Preview</button><button class="btn primary" @click="save">Save</button></div>
        <div v-if="preview" class="result" style="margin-top:10px">{{ preview }}</div>
        <div v-if="err" class="err-inline" style="margin-top:8px">{{ err }}</div>
      </div>
    </div>
    <div v-if="toast" class="toast ok">{{ toast }}</div>
  </div>
</template>
