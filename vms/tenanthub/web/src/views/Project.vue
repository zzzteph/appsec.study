<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get, post } from '../api'

const route = useRoute(); const router = useRouter()
const project = ref(null); const tickets = ref([]); const tpl = ref(''); const out = ref(null); const err = ref('')
async function load() {
  project.value = await get('/projects/' + route.params.id)
  tickets.value = await get('/projects/' + route.params.id + '/tickets')
  tpl.value = project.value.automation_template || ''
}
onMounted(load)
async function preview() {
  err.value = ''; out.value = null
  try { out.value = await post('/projects/' + route.params.id + '/automation/preview', { template: tpl.value }) }
  catch (e) { err.value = e.message }
}
</script>

<template>
  <div v-if="project">
    <div class="row" style="margin-bottom:6px"><h1 style="margin:0">{{ project.name }}</h1><span class="badge role">org #{{ project.org_id }}</span></div>
    <p class="muted">{{ project.description }}</p>

    <div class="grid" style="grid-template-columns:1.6fr 1fr;align-items:start;margin-top:16px">
      <div class="card">
        <h3>Tickets</h3>
        <table><thead><tr><th>Title</th><th>Status</th><th>Priority</th></tr></thead>
          <tbody><tr v-for="t in tickets" :key="t.id" style="cursor:pointer" @click="router.push('/ticket/' + t.id)">
            <td>{{ t.title }}</td><td><span class="badge open">{{ t.status }}</span></td><td><span class="badge" :class="t.priority==='critical'?'crit':'warn'">{{ t.priority }}</span></td></tr></tbody></table>
        <div v-if="!tickets.length" class="muted">No tickets.</div>
      </div>

      <div class="card">
        <h3>Automation</h3>
        <p class="muted" style="font-size:13px">Notification template run when tickets change. Variables: title, status, assignee.</p>
        <textarea v-model="tpl" class="mono"></textarea>
        <button class="btn primary" style="margin-top:10px" @click="preview">Preview</button>
        <div v-if="out" class="result" style="margin-top:10px">{{ out.rendered }}</div>
        <div v-if="err" class="err-inline" style="margin-top:10px">{{ err }}</div>
      </div>
    </div>
  </div>
</template>
