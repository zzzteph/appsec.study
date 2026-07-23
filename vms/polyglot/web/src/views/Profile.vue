<script setup>
import { ref, onMounted } from 'vue'
import { get, post, patch, setAuth, currentUser } from '../api'
import { avatar } from '../assets/art'
const me = ref(null); const form = ref({ name: '' }); const email = ref(''); const toast = ref(null); const err = ref('')
function flash(m, ok = true) { toast.value = { m, ok }; setTimeout(() => toast.value = null, 2000) }
async function load() { me.value = await get('/me'); form.value = { name: me.value.name }; email.value = me.value.email }
onMounted(load)
async function save() { try { me.value = await patch('/me', form.value); setAuth(null, { ...currentUser(), ...me.value }); flash('Saved') } catch (e) { err.value = e.message } }
async function changeEmail() { try { await post('/me/email', { email: email.value }); flash('Email updated') } catch (e) { err.value = e.message } }
</script>
<template>
  <h1>Account</h1>
  <div v-if="me" class="grid g2" style="align-items:start">
    <div class="card">
      <div class="row" style="margin-bottom:12px"><img class="avatar" :src="avatar(me.username, 52)" width="52" height="52" /><div><h3 style="margin:0">{{ me.name }}</h3><span class="muted">{{ me.email }}</span> · <span class="badge brand">{{ me.role }}</span></div></div>
      <div class="field"><label>Display name</label><input v-model="form.name" /></div>
      <button class="btn primary" @click="save">Save</button>
    </div>
    <div class="card"><h3>Email</h3><div class="row"><input v-model="email" type="email" style="flex:1" /><button class="btn" @click="changeEmail">Update</button></div></div>
  </div>
  <div v-if="err" class="err-inline" style="margin-top:12px">{{ err }}</div>
  <div v-if="toast" class="toast" :class="toast.ok?'ok':'err'">{{ toast.m }}</div>
</template>
