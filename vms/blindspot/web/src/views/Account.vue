<script setup>
import { ref, onMounted } from 'vue'
import { get, post, currentUser } from '../api'
const me = currentUser()
const addresses = ref([]); const activity = ref([]); const fb = ref({ subject: '', body: '' }); const sub = ref(''); const toast = ref(null)
async function load() { addresses.value = await get('/addresses'); try { activity.value = await get('/account/activity') } catch {} }
onMounted(load)
async function sendFeedback() { if (!fb.value.subject) return; await post('/feedback', fb.value); fb.value = { subject: '', body: '' }; toast.value = 'Thanks for your feedback'; setTimeout(() => toast.value = null, 2000) }
async function checkSub() { await get('/subscribe/status?ref=' + encodeURIComponent(sub.value)); toast.value = 'Subscription checked'; setTimeout(() => toast.value = null, 1800) }
</script>
<template>
  <div class="content">
    <h1>My Account</h1>
    <div class="grid g2" style="align-items:start">
      <div class="card">
        <h3>Saved addresses</h3>
        <div v-for="a in addresses" :key="a.id" style="padding:8px 0;border-bottom:1px solid var(--line)"><b>{{ a.label }}</b><div class="muted" style="font-size:13px">{{ a.line1 }}, {{ a.city }} {{ a.zip }}</div></div>
        <h3 style="margin-top:16px">Recent activity</h3>
        <div v-for="(e,i) in activity" :key="i" class="muted" style="font-size:13px;padding:4px 0">{{ e.event }} <span style="opacity:.6">· {{ e.created }}</span></div>
      </div>
      <div class="grid" style="gap:14px">
        <div class="card">
          <h3>Delivery notifications</h3>
          <p class="muted" style="font-size:13px">Check the status of a notification subscription.</p>
          <div class="row"><input v-model="sub" placeholder="reference…" style="flex:1" /><button class="btn" @click="checkSub">Check</button></div>
        </div>
        <div class="card">
          <h3>Send feedback</h3>
          <div class="field"><label>Subject</label><input v-model="fb.subject" /></div>
          <div class="field"><label>Message</label><textarea v-model="fb.body"></textarea></div>
          <button class="btn primary" @click="sendFeedback">Submit</button>
        </div>
      </div>
    </div>
    <div v-if="toast" class="toast ok">{{ toast }}</div>
  </div>
</template>
