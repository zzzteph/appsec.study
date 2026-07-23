<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { post, setAuth } from '../api'
import { logo } from '../assets/art'
const route = useRoute(); const router = useRouter()
const tab = ref('otp'); const step = ref('request')
const f = ref({ msisdn: '', code: '', username: '', password: '' }); const err = ref(''); const note = ref(''); const busy = ref(false)
async function requestOtp() { err.value = ''; busy.value = true; try { await post('/auth/otp/request', { msisdn: f.value.msisdn }); step.value = 'verify'; note.value = 'Code sent to your number (check your inbox).' } catch (e) { err.value = e.message } finally { busy.value = false } }
async function verifyOtp() { err.value = ''; busy.value = true; try { const d = await post('/auth/otp/verify', { msisdn: f.value.msisdn, code: f.value.code }); setAuth(d.access, d.user); router.push(route.query.next || '/') } catch (e) { err.value = e.message } finally { busy.value = false } }
async function pwLogin() { err.value = ''; busy.value = true; try { const d = await post('/auth/login', { username: f.value.username, password: f.value.password }); setAuth(d.access, d.user); router.push(route.query.next || '/') } catch (e) { err.value = e.message } finally { busy.value = false } }
</script>
<template>
  <div class="auth">
    <div class="box">
      <div class="center" style="flex-direction:column;gap:8px;margin-bottom:22px"><img :src="logo(52)" width="52" height="52" /><h1 style="margin:0">MobiCare</h1><div class="muted">Manage your line</div></div>
      <div class="card">
        <div class="tabs"><button :class="{ active: tab === 'otp' }" @click="tab = 'otp'">Sign in with code</button><button :class="{ active: tab === 'pw' }" @click="tab = 'pw'">Password</button></div>
        <template v-if="tab === 'otp'">
          <template v-if="step === 'request'">
            <div class="field"><label>Mobile number</label><input v-model="f.msisdn" placeholder="+1-555-0100" /></div>
            <button class="btn primary" style="width:100%" :disabled="busy" @click="requestOtp">Send code</button>
          </template>
          <template v-else>
            <div class="field"><label>Enter the 6-digit code</label><input v-model="f.code" maxlength="6" placeholder="••••••" /></div>
            <button class="btn primary" style="width:100%" :disabled="busy" @click="verifyOtp">Verify & sign in</button>
          </template>
        </template>
        <template v-else>
          <div class="field"><label>Username</label><input v-model="f.username" /></div>
          <div class="field"><label>Password</label><input v-model="f.password" type="password" /></div>
          <button class="btn primary" style="width:100%" :disabled="busy" @click="pwLogin">Sign in</button>
        </template>
        <div v-if="note" class="badge ok" style="margin-top:10px">{{ note }}</div>
        <div v-if="err" class="err-inline" style="margin-top:10px">{{ err }}</div>
      </div>
      <div class="center muted" style="margin-top:16px;font-size:13px">Demo — <b>demo</b> / <b>demo</b> · or number <b>+1-555-0100</b></div>
    </div>
  </div>
</template>
