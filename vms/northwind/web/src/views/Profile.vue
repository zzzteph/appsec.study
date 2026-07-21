<script setup>
import { ref, onMounted } from 'vue'
import { get, post, patch } from '../api'
import { avatar } from '../assets/art'

const me = ref(null); const payees = ref([]); const email = ref('')
const form = ref({ name: '', phone: '', address: '' })
const newPayee = ref({ name: '', account_number: '', bank: '' })
const toast = ref(null); const err = ref('')
function flash(m, ok = true) { toast.value = { m, ok }; setTimeout(() => toast.value = null, 2200) }
async function load() {
  me.value = await get('/me'); payees.value = await get('/payees'); email.value = me.value.email
  form.value = { name: me.value.name, phone: me.value.phone, address: me.value.address }
}
onMounted(load)
async function save() { try { me.value = await patch('/me', form.value); flash('Profile saved') } catch (e) { err.value = e.message } }
async function changeEmail() { try { await post('/me/email', { email: email.value }); flash('Email updated') } catch (e) { err.value = e.message } }
async function addPayee() { try { await post('/payees', newPayee.value); payees.value = await get('/payees'); newPayee.value = { name: '', account_number: '', bank: '' }; flash('Payee added') } catch (e) { err.value = e.message } }
</script>

<template>
  <h1>Profile</h1>
  <div v-if="me" class="grid g2" style="align-items:start">
    <div class="card">
      <div class="row" style="margin-bottom:12px"><img class="avatar" :src="avatar(me.username, 52)" width="52" height="52" />
        <div><h3 style="margin:0">{{ me.name }}</h3><span class="muted">{{ me.username }}</span> · <span class="badge" :class="me.tier==='premium'||me.tier==='business'?'premium':'ok'">{{ me.tier }}</span></div></div>
      <div class="field"><label>Full name</label><input v-model="form.name" /></div>
      <div class="field"><label>Phone</label><input v-model="form.phone" /></div>
      <div class="field"><label>Address</label><input v-model="form.address" /></div>
      <button class="btn primary" @click="save">Save profile</button>
      <div style="margin-top:14px" class="row"><span class="muted">Daily transfer limit</span><b>${{ me.daily_limit }}</b><span class="grow"></span><span class="muted">KYC</span><span class="badge" :class="me.kyc_status==='verified'?'ok':'warn'">{{ me.kyc_status }}</span></div>
    </div>
    <div class="grid" style="gap:16px">
      <div class="card"><h3>Email</h3><div class="row"><input v-model="email" type="email" style="flex:1" /><button class="btn" @click="changeEmail">Update</button></div></div>
      <div class="card">
        <h3>Payees</h3>
        <div v-for="p in payees" :key="p.id" class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><b>{{ p.name }}</b><span class="grow"></span><span class="muted mono" style="font-size:12px">{{ p.account_number }}</span></div>
        <div class="row" style="margin-top:12px"><input v-model="newPayee.name" placeholder="name" style="flex:1" /><input v-model="newPayee.account_number" placeholder="acct #" style="width:90px" /><button class="btn sm" @click="addPayee">Add</button></div>
      </div>
    </div>
  </div>
  <div v-if="err" class="err-inline" style="margin-top:12px">{{ err }}</div>
  <div v-if="toast" class="toast" :class="toast.ok?'ok':'err'">{{ toast.m }}</div>
</template>
