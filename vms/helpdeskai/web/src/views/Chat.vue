<template>
  <div class="chat">
    <div class="stream" ref="stream">
      <div v-if="!msgs.length" class="muted" style="text-align:center;margin-top:40px">
        <div style="font-size:40px">✦</div>
        <p>Hi! I'm your HelpDeskAI assistant. Ask about orders, billing, your account, or anything in our knowledge base.</p>
      </div>
      <div v-for="(m,i) in msgs" :key="i" class="msg" :class="{me: m.role==='user'}">
        <div v-if="m.role!=='user'" class="av ai">✦</div>
        <div v-else class="av me">{{ initials }}</div>
        <div style="min-width:0">
          <div class="who">{{ m.role==='user' ? 'You' : 'HelpDeskAI' }}</div>
          <div class="bubble">{{ m.text }}</div>
          <details v-if="m.trace" class="trace">
            <summary>Agent trace · {{ m.trace.length }} steps</summary>
            <div v-for="(s,j) in m.trace" :key="j" class="tstep">
              <b>{{ s.step }}</b>
              <span v-if="s.docs"> → {{ s.docs.join(', ') || '(none)' }}</span>
              <span v-if="s.name"> · {{ s.name }}<span v-if="s.args"> ({{ JSON.stringify(s.args) }})</span></span>
              <pre v-if="s.result !== undefined">{{ fmt(s.result) }}</pre>
            </div>
          </details>
        </div>
      </div>
      <div v-if="busy" class="msg"><div class="av ai">✦</div><div class="bubble muted">Thinking…</div></div>
    </div>
    <div class="suggest">
      <span class="s" v-for="s in suggestions" :key="s" @click="draft=s">{{ s }}</span>
    </div>
    <div class="compose">
      <textarea v-model="draft" placeholder="Message the assistant…" @keydown.enter.exact.prevent="send"></textarea>
      <button @click="send" :disabled="busy || !draft.trim()">Send</button>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, nextTick } from 'vue'
import { post, currentUser } from '../api'
const msgs = ref([]); const draft = ref(''); const busy = ref(false); const stream = ref(null)
const initials = computed(() => { const u = currentUser(); return ((u && u.name) || '?').slice(0,1).toUpperCase() })
const suggestions = ['How do I reset my password?', 'Where is my order?', 'How do I upgrade to Pro?', 'What is your refund policy?']
const fmt = (r) => typeof r === 'string' ? r : JSON.stringify(r, null, 2)
function scroll(){ nextTick(() => { const el = stream.value; if (el) el.scrollTop = el.scrollHeight }) }
async function send(){
  const text = draft.value.trim(); if (!text || busy.value) return
  msgs.value.push({ role: 'user', text }); draft.value = ''; busy.value = true; scroll()
  try { const r = await post('/chat', { message: text }); msgs.value.push({ role: 'ai', text: r.answer, trace: r.trace }) }
  catch (e) { msgs.value.push({ role: 'ai', text: 'Error: ' + e.message }) }
  finally { busy.value = false; scroll() }
}
</script>
