<script setup>
import { ref, onMounted } from 'vue'
import { get, post, patch, setAuth, currentUser } from '../api'
const me = ref(null); const email = ref(''); const settings = ref('{"theme":"dark","notifications":true}'); const out = ref(null); const toast = ref(null); const err = ref('')
function flash(m) { toast.value = m; setTimeout(() => toast.value = null, 1600) }
async function load() { me.value = await get('/me'); email.value = me.value.email }
onMounted(load)
async function saveEmail() { try { me.value = await patch('/me', { email: email.value }); setAuth(null, { ...currentUser(), ...me.value }); flash('Saved') } catch (e) { err.value = e.message } }
async function saveSettings() { err.value = ''; try { out.value = (await post('/me/settings', { settings: JSON.parse(settings.value) })).settings; flash('Settings updated') } catch (e) { err.value = e.message } }
</script>
<template>
  <div class="content">
    <h1>Settings</h1>
    <div class="grid g2" style="align-items:start">
      <div class="card">
        <h3>Profile</h3>
        <div class="field"><label>Username</label><input :value="me?.username" readonly /></div>
        <div class="field"><label>Role</label><input :value="me?.role" readonly /></div>
        <div class="field"><label>Email</label><input v-model="email" type="email" /></div>
        <button class="btn primary" @click="saveEmail">Save profile</button>
      </div>
      <div class="card">
        <h3>Preferences</h3>
        <p class="muted" style="font-size:13px">Your preferences are merged into your account settings (JSON).</p>
        <textarea v-model="settings" class="mono"></textarea>
        <button class="btn primary" style="margin-top:8px" @click="saveSettings">Save preferences</button>
        <div v-if="out" class="result" style="margin-top:8px">{{ JSON.stringify(out) }}</div>
        <div v-if="err" class="err-inline" style="margin-top:8px">{{ err }}</div>
      </div>
    </div>
    <div v-if="toast" class="toast ok">{{ toast }}</div>
  </div>
</template>
