<template>
  <div class="chat">
    <aside class="side">
      <h4>Channels</h4>
      <div v-for="r in publicRooms" :key="r.id" class="rm" :class="{active:r.name===active}" @click="join(r.name)">
        <span class="hash">#</span> {{ r.name }}
      </div>
      <h4>Private</h4>
      <div v-for="r in privateRooms" :key="r.id" class="rm" :class="{active:r.name===active}" @click="join(r.name)">
        <span class="hash">🔒</span> {{ r.name }}
      </div>
      <div class="muted" style="margin:10px 8px;font-size:11px">You are a member of channels you belong to. Private channels are invite-only.</div>
    </aside>
    <section class="main">
      <div class="mhead">
        <strong v-if="active">{{ activePrivate ? '🔒' : '#' }} {{ active }}</strong>
        <span v-else class="muted">Select a channel</span>
        <div class="spacer"></div>
        <span class="status" :class="connected?'on':'off'">● {{ connected ? 'connected' : 'offline' }}</span>
      </div>
      <div class="stream" ref="stream">
        <div v-for="(m,i) in messages" :key="i" class="msg">
          <div class="av" :style="{background:'hsl('+hue(m.sender)+' 60% 50%)'}">{{ initials(m.sender) }}</div>
          <div>
            <div><span class="who">{{ m.sender }}</span><span class="tm">{{ m.created || 'now' }}</span></div>
            <!-- messages render inline formatting -->
            <div class="body" v-html="m.text"></div>
          </div>
        </div>
        <div v-if="active && !messages.length" class="muted">No messages yet — say hello.</div>
      </div>
      <div class="compose" v-if="active">
        <input v-model="draft" @keyup.enter="send" :placeholder="'Message ' + active" />
        <button @click="send" :disabled="!draft.trim()">Send</button>
      </div>
    </section>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { token } from '../api'
import { hue, initials } from '../assets/art.js'
const router = useRouter()
const rooms = ref([]); const active = ref(''); const activePrivate = ref(false)
const messages = ref([]); const draft = ref(''); const connected = ref(false)
const stream = ref(null)
let ws = null
const publicRooms = computed(() => rooms.value.filter(r => !r.private))
const privateRooms = computed(() => rooms.value.filter(r => r.private))
function scroll(){ nextTick(() => { const el = stream.value; if (el) el.scrollTop = el.scrollHeight }) }
function connect(){
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  ws = new WebSocket(proto + '://' + location.host + '/ws?token=' + encodeURIComponent(token() || ''))
  ws.onopen = () => { connected.value = true; ws.send(JSON.stringify({ type: 'rooms' })) }
  ws.onclose = () => { connected.value = false }
  ws.onmessage = (ev) => {
    let m; try { m = JSON.parse(ev.data) } catch { return }
    if (m.type === 'rooms') { rooms.value = m.rooms; if (!active.value && m.rooms.length) join(m.rooms[0].name) }
    else if (m.type === 'history') { active.value = m.room; activePrivate.value = m.private; messages.value = m.messages || []; scroll() }
    else if (m.type === 'msg') { if (m.room === active.value) { messages.value.push(m); scroll() } }
  }
}
function join(name){ active.value = name; messages.value = []; if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'join', room: name })) }
function send(){
  const t = draft.value.trim(); if (!t || !ws) return
  ws.send(JSON.stringify({ type: 'msg', room: active.value, text: t }))
  draft.value = ''
}
onMounted(connect)
onBeforeUnmount(() => { if (ws) ws.close() })
</script>
