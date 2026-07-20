<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from './api.js'   // keeps api.js + the /api/run reference in this lazy chunk

const emit = defineEmits(['logout'])
const me = ref(localStorage.getItem('rg_user') ? { username: localStorage.getItem('rg_user') } : null)
const cmd = ref('id')
const output = ref('')
const err = ref('')
const busy = ref(false)

async function run() {
  err.value = ''; output.value = ''; busy.value = true
  try { output.value = (await post('/run', { cmd: cmd.value })).output }
  catch (e) { err.value = e.message } finally { busy.value = false }
}
onMounted(async () => { try { me.value = await get('/me') } catch { /* keep cached */ } })
</script>

<template>
  <div class="dash">
    <header class="topbar">
      <span class="brand"><span class="logo">📝</span> Reggie</span>
      <span class="spacer"></span>
      <span class="who" v-if="me">{{ me.username }}</span>
      <button class="btn flat" @click="emit('logout')">Sign out</button>
    </header>
    <main>
      <div class="card pad">
        <h2>System diagnostics</h2>
        <p class="muted">Run a maintenance command on the host. Your session token refreshes automatically
          every minute.</p>
        <label class="lbl">Command</label>
        <div class="row">
          <input class="field" v-model="cmd" @keyup.enter="run" />
          <button class="btn" :disabled="busy" @click="run">Run</button>
        </div>
        <p v-if="err" class="err">{{ err }}</p>
        <pre v-if="output" class="out">{{ output }}</pre>
      </div>
    </main>
  </div>
</template>
