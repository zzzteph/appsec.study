<script setup>
import { ref, onMounted } from 'vue'
import { get, post, patch, setAuth, currentUser } from '../api'
import { avatar } from '../assets/art'

const me = ref(null); const ref_ = ref(null); const kyc = ref(null)
const form = ref({ display_name: '', bio: '', country: '' })
const email = ref(''); const twofa = ref(null); const code = ref('')
const toast = ref(null); const err = ref('')
function flash(m, ok = true) { toast.value = { m, ok }; setTimeout(() => toast.value = null, 2400) }

async function load() {
  me.value = await get('/me')
  form.value = { display_name: me.value.display_name, bio: me.value.bio, country: me.value.country }
  email.value = me.value.email
  ref_.value = await get('/referral/code'); kyc.value = await get('/kyc/status')
}
onMounted(load)

async function saveProfile() {
  try { me.value = await patch('/me', form.value); setAuth(null, { ...currentUser(), ...me.value }); flash('Profile saved') }
  catch (e) { err.value = e.message }
}
async function changeEmail() {
  try { await post('/me/email', { email: email.value }); flash('Email updated') } catch (e) { err.value = e.message }
}
async function claimRef() {
  try { const d = await post('/referral/claim', { code: ref_.value.code }); flash(`+${d.credited.you} RC`) } catch (e) { err.value = e.message }
}
async function setup2fa() { twofa.value = await post('/auth/2fa/setup') }
async function verify2fa() {
  try { await post('/auth/2fa/verify', { code: code.value }); flash('2FA verified') } catch (e) { err.value = e.message }
}
function onFile(e) {
  const file = e.target.files[0]; if (!file) return
  const r = new FileReader()
  r.onload = async () => {
    try { await post('/kyc/upload', { type: 'id_front', filename: file.name, content: r.result }); kyc.value = await get('/kyc/status'); flash('Document uploaded') }
    catch (er) { err.value = er.message }
  }
  r.readAsDataURL(file)
}
</script>

<template>
  <h1>Account</h1>
  <div v-if="me" class="grid g2" style="align-items:start">
    <div class="card">
      <div class="row" style="margin-bottom:14px">
        <img class="avatar" :src="avatar(me.avatar_seed || me.username, 56)" width="56" height="56" />
        <div><h3 style="margin:0">{{ me.display_name }}</h3><span class="muted">@{{ me.username }}</span>
          <span class="badge" :class="me.vip_tier" style="margin-left:6px">{{ me.vip_tier }}</span></div>
      </div>
      <div class="field"><label>Display name</label><input v-model="form.display_name" /></div>
      <div class="field"><label>Bio</label><textarea v-model="form.bio"></textarea></div>
      <div class="field"><label>Country</label><input v-model="form.country" /></div>
      <button class="btn primary" @click="saveProfile">Save profile</button>
    </div>

    <div class="grid" style="gap:16px">
      <div class="card">
        <h3>Email</h3>
        <div class="row"><input v-model="email" type="email" style="flex:1" /><button class="btn" @click="changeEmail">Update</button></div>
      </div>

      <div class="card">
        <h3>Referrals</h3>
        <p class="muted" style="font-size:13px">Share your code — you both get a bonus.</p>
        <div class="row"><input :value="ref_?.code" readonly class="mono" style="flex:1" /><button class="btn gold" @click="claimRef">Claim</button></div>
      </div>

      <div class="card">
        <h3>Identity verification</h3>
        <div class="row"><span class="muted">Status</span><span class="badge" :class="kyc?.status === 'verified' ? 'ok' : 'warn'">{{ kyc?.status }}</span></div>
        <input type="file" accept="image/*" style="margin-top:10px" @change="onFile" />
      </div>

      <div class="card">
        <h3>Two-factor auth</h3>
        <button v-if="!twofa" class="btn" @click="setup2fa">Enable 2FA</button>
        <template v-else>
          <div class="mono" style="font-size:12px;margin:8px 0">{{ twofa.secret }}</div>
          <div class="row"><input v-model="code" placeholder="6-digit code" maxlength="6" /><button class="btn primary" @click="verify2fa">Verify</button></div>
        </template>
      </div>
    </div>
  </div>
  <div v-if="err" class="err-inline" style="margin-top:12px">{{ err }}</div>
  <div v-if="toast" class="toast" :class="toast.ok ? 'ok' : 'err'">{{ toast.m }}</div>
</template>
