<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../api'
const tickets = ref([]); const faq = ref([]); const f = ref({ subject: '', body: '' }); const toast = ref(null)
onMounted(async () => { tickets.value = await get('/tickets'); faq.value = await get('/faq') })
async function submit() {
  if (!f.value.subject) return
  await post('/tickets', f.value); f.value = { subject: '', body: '' }; tickets.value = await get('/tickets')
  toast.value = 'Ticket submitted'; setTimeout(() => toast.value = null, 2000)
}
</script>

<template>
  <h1>Support</h1>
  <div class="grid g2" style="align-items:start">
    <div class="card">
      <h3>New ticket</h3>
      <div class="field"><label>Subject</label><input v-model="f.subject" /></div>
      <div class="field"><label>Message</label><textarea v-model="f.body"></textarea></div>
      <button class="btn primary" @click="submit">Submit</button>
      <div style="margin-top:16px">
        <div v-for="t in tickets" :key="t.id" class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><b>{{ t.subject }}</b><span class="grow"></span><span class="badge warn">{{ t.status }}</span></div>
      </div>
    </div>
    <div class="card">
      <h3>FAQ</h3>
      <div v-for="(q,i) in faq" :key="i" style="margin-bottom:12px"><b>{{ q.q }}</b><div class="muted" style="font-size:13px">{{ q.a }}</div></div>
    </div>
  </div>
  <div v-if="toast" class="toast ok">{{ toast }}</div>
</template>
