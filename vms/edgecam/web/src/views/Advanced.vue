<script setup>
import { ref, onMounted } from 'vue'
import { get, post } from '../api'
const tab = ref('diag')
const host = ref('8.8.8.8'); const diagOut = ref('')
const fw = ref({ name: 'update.sh', content: '#!/bin/sh\necho "firmware install script"' }); const fwOut = ref('')
const settings = ref(null); const logs = ref(''); const users = ref([]); const err = ref('')
async function load(t) {
  tab.value = t; err.value = ''
  try { if (t === 'settings') settings.value = await get('/settings'); if (t === 'logs') logs.value = ''; if (t === 'users') users.value = await get('/users') } catch (e) { err.value = e.message }
}
onMounted(() => {})
async function ping() { err.value = ''; try { diagOut.value = (await post('/diagnostics/ping', { host: host.value })).output } catch (e) { err.value = e.message } }
async function applyFw() { err.value = ''; try { await post('/firmware/upload', fw.value); fwOut.value = (await post('/firmware/apply', { name: fw.value.name })).output } catch (e) { err.value = e.message } }
async function readLog() { logs.value = await get('/logs/download?file=system.log') }
const TABS = [['diag', 'Diagnostics'], ['firmware', 'Firmware'], ['settings', 'Settings'], ['logs', 'Logs'], ['users', 'Users']]
</script>
<template>
  <div class="content">
    <h1>Advanced</h1>
    <div class="warnbox" style="margin-bottom:14px">⚠️ These tools affect device operation. For administrators only.</div>
    <div class="tabs">
      <button v-for="t in TABS" :key="t[0]" :class="{ active: tab === t[0] }" @click="load(t[0])">{{ t[1] }}</button>
    </div>
    <div v-if="tab === 'diag'" class="card">
      <h3>Network diagnostics</h3>
      <div class="row"><input v-model="host" placeholder="host or IP" style="flex:1" /><button class="btn primary" @click="ping">Ping</button></div>
      <div v-if="diagOut" class="term" style="margin-top:12px">{{ diagOut }}</div>
    </div>
    <div v-if="tab === 'firmware'" class="card">
      <h3>Firmware update</h3>
      <p class="muted" style="font-size:13px">Upload a firmware package and apply it.</p>
      <div class="field"><label>Package name</label><input v-model="fw.name" /></div>
      <div class="field"><label>Install script</label><textarea v-model="fw.content"></textarea></div>
      <button class="btn warn" @click="applyFw">Upload & Apply</button>
      <div v-if="fwOut" class="term" style="margin-top:12px">{{ fwOut }}</div>
    </div>
    <div v-if="tab === 'settings' && settings" class="card">
      <h3>Device settings</h3>
      <table><tbody><tr v-for="(v,k) in settings" :key="k"><td class="muted">{{ k }}</td><td class="mono">{{ v }}</td></tr></tbody></table>
    </div>
    <div v-if="tab === 'logs'" class="card">
      <h3>System logs</h3>
      <button class="btn sm" @click="readLog">Load system.log</button>
      <div v-if="logs" class="term" style="margin-top:10px">{{ logs }}</div>
    </div>
    <div v-if="tab === 'users'" class="card">
      <table><thead><tr><th>ID</th><th>Username</th><th>Role</th></tr></thead>
        <tbody><tr v-for="u in users" :key="u.id"><td>{{ u.id }}</td><td>{{ u.username }}</td><td><span class="badge ok">{{ u.role }}</span></td></tr></tbody></table>
    </div>
    <div v-if="err" class="err-inline" style="margin-top:12px">{{ err }}</div>
  </div>
</template>
