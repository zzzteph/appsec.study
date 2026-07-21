<script setup>
import { ref, onMounted } from 'vue'
import { get, post, currentUser } from '../api'
import { avatar } from '../assets/art'

const me = currentUser()
const chat = ref([]); const feed = ref([]); const friends = ref([])
const msg = ref(''); const tip = ref({ to_id: '', amount: 5 }); const err = ref(''); const toast = ref(null)

async function load() {
  chat.value = await get('/chat'); feed.value = await get('/feed'); friends.value = await get('/friends')
}
onMounted(load)
async function send() {
  if (!msg.value.trim()) return
  await post('/chat', { message: msg.value }); msg.value = ''; chat.value = await get('/chat')
}
async function shareWin() {
  await post('/feed', { game: 'crash', amount: 250, note: 'big win on crash 🎉' }); feed.value = await get('/feed')
}
async function sendTip() {
  err.value = ''
  try { const d = await post('/social/tip', { from_id: me.id, to_id: Number(tip.value.to_id), amount: Number(tip.value.amount) }); toast.value = `Sent ${d.amount} RC`; setTimeout(() => toast.value = null, 2200) }
  catch (e) { err.value = e.message }
}
</script>

<template>
  <h1>Community</h1>
  <div class="grid" style="grid-template-columns:1.4fr 1fr;align-items:start">
    <div class="card">
      <h3>💬 Live chat</h3>
      <div style="max-height:340px;overflow:auto">
        <!-- messages are rendered as rich content -->
        <div v-for="c in chat" :key="c.id" class="chatline row">
          <img class="avatar" :src="avatar(c.username, 28)" width="28" height="28" />
          <b>{{ c.username }}</b><span v-html="c.message"></span>
        </div>
      </div>
      <div class="row" style="margin-top:12px"><input v-model="msg" placeholder="Say something…" style="flex:1" @keyup.enter="send" />
        <button class="btn primary" @click="send">Send</button></div>
    </div>

    <div class="grid" style="gap:16px">
      <div class="card">
        <h3>🎁 Send a tip</h3>
        <div class="field"><label>To player</label>
          <select v-model="tip.to_id"><option value="">Choose…</option>
            <option v-for="(f, i) in friends" :key="i" :value="i + 2">{{ f.display_name }}</option></select></div>
        <div class="field"><label>Amount (RC)</label><input v-model="tip.amount" type="number" /></div>
        <button class="btn gold" style="width:100%" @click="sendTip">Send tip</button>
        <div v-if="err" class="err-inline" style="margin-top:8px">{{ err }}</div>
      </div>
      <div class="card">
        <div class="row"><h3 style="margin:0">🏆 Big wins</h3><span class="grow"></span><button class="btn sm ghost" @click="shareWin">Share a win</button></div>
        <div v-for="w in feed" :key="w.id" class="chatline">
          <div class="row"><b>{{ w.username }}</b><span class="grow"></span><b class="green">+{{ w.amount }} RC</b></div>
          <div class="muted" style="font-size:13px" v-html="w.note"></div>
        </div>
      </div>
    </div>
  </div>
  <div v-if="toast" class="toast ok">{{ toast }}</div>
</template>
