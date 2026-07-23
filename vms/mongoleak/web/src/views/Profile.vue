<script setup>
import { ref, onMounted } from 'vue'
import { get, patch, setAuth, currentUser } from '../api'
const me = ref(null); const email = ref(''); const toast = ref(null); const err = ref('')
async function load() { me.value = await get('/me'); email.value = me.value.email }
onMounted(load)
async function save() { try { me.value = await patch('/me', { email: email.value }); setAuth(null, { ...currentUser(), ...me.value }); toast.value = 'Saved'; setTimeout(() => toast.value = null, 1600) } catch (e) { err.value = e.message } }
</script>
<template>
  <div class="content">
    <h1>Account</h1>
    <div v-if="me" class="card" style="max-width:440px">
      <div class="field"><label>Username</label><input :value="me.username" readonly /></div>
      <div class="field"><label>Role</label><input :value="me.role" readonly /></div>
      <div class="field"><label>Email</label><input v-model="email" type="email" /></div>
      <button class="btn primary" @click="save">Save</button>
    </div>
    <div v-if="err" class="err-inline" style="margin-top:12px">{{ err }}</div>
    <div v-if="toast" class="toast ok">{{ toast }}</div>
  </div>
</template>
