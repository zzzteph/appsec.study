<template>
  <div class="section wrap">
    <h2>Support tickets</h2>
    <div class="card" style="margin-bottom:18px">
      <h3 style="margin-top:0">Open a ticket</h3>
      <div class="field"><label>Subject</label><input v-model="subject" placeholder="Short summary" /></div>
      <div class="field"><label>Message</label><textarea v-model="body" rows="4" placeholder="Describe the issue…"></textarea></div>
      <button @click="submit" :disabled="!subject.trim()">Submit ticket</button>
    </div>

    <div class="card">
      <h3 style="margin-top:0">Your tickets</h3>
      <table v-if="tickets.length">
        <thead><tr><th>#</th><th>Subject</th><th>Status</th><th>Created</th><th></th></tr></thead>
        <tbody><tr v-for="t in tickets" :key="t.id">
          <td>{{ t.id }}</td><td>{{ t.subject }}</td><td><span class="pill">{{ t.status }}</span></td><td class="muted">{{ t.created }}</td>
          <td><button class="ghost sm" @click="triage(t)">✦ Triage with AI</button></td>
        </tr></tbody>
      </table>
      <div v-else class="muted">No tickets yet.</div>
      <div v-if="result" class="trace" style="margin-top:14px">
        <div class="who">AI triage of ticket #{{ result.id }}</div>
        <div class="bubble" style="margin-top:6px">{{ result.answer }}</div>
        <details style="margin-top:8px"><summary>Agent trace</summary>
          <pre>{{ JSON.stringify(result.trace, null, 2) }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../api'
const subject = ref(''); const body = ref(''); const tickets = ref([]); const result = ref(null)
async function load(){ tickets.value = await get('/tickets') }
async function submit(){ await post('/tickets', { subject: subject.value, body: body.value }); subject.value=''; body.value=''; await load() }
async function triage(t){ result.value = null; const r = await post('/tickets/' + t.id + '/triage'); result.value = { id: t.id, answer: r.answer, trace: r.trace } }
onMounted(load)
</script>
