<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { post, setAuth } from '../api'
import { logo } from '../assets/art'

const route = useRoute(); const router = useRouter()
const tab = ref('login')
const f = ref({ username: '', email: '', password: '', name: '' })
const err = ref(''); const note = ref(''); const busy = ref(false)

async function submit() {
  err.value = ''; note.value = ''; busy.value = true
  try {
    if (tab.value === 'reset') { await post('/auth/reset', { email: f.value.email }); note.value = 'If that account exists, a reset link was sent to its inbox.'; return }
    const d = await post(tab.value === 'login' ? '/auth/login' : '/auth/register', f.value)
    setAuth(d.access, d.user); router.push(route.query.next || '/')
  } catch (e) { err.value = e.message } finally { busy.value = false }
}
</script>

<template>
  <div class="auth">
    <div class="box">
      <div class="center" style="flex-direction:column;gap:8px;margin-bottom:22px"><img :src="logo(52)" width="52" height="52" /><h1 style="margin:0">Northwind Bank</h1><div class="muted">Online banking</div></div>
      <div class="card">
        <div class="tabs">
          <button :class="{ active: tab === 'login' }" @click="tab = 'login'">Sign in</button>
          <button :class="{ active: tab === 'register' }" @click="tab = 'register'">Open account</button>
          <button :class="{ active: tab === 'reset' }" @click="tab = 'reset'">Reset</button>
        </div>
        <form @submit.prevent="submit">
          <div v-if="tab !== 'reset'" class="field"><label>Username</label><input v-model="f.username" autocomplete="username" /></div>
          <div v-if="tab === 'register'" class="field"><label>Full name</label><input v-model="f.name" /></div>
          <div v-if="tab === 'register' || tab === 'reset'" class="field"><label>Email</label><input v-model="f.email" type="email" /></div>
          <div v-if="tab !== 'reset'" class="field"><label>Password</label><input v-model="f.password" type="password" autocomplete="current-password" /></div>
          <div v-if="err" class="err-inline" style="margin-bottom:10px">{{ err }}</div>
          <div v-if="note" class="badge ok" style="margin-bottom:10px">{{ note }}</div>
          <button class="btn primary" style="width:100%" :disabled="busy">{{ busy ? '…' : (tab === 'login' ? 'Sign in' : tab === 'register' ? 'Open account' : 'Send reset link') }}</button>
        </form>
      </div>
      <div class="center muted" style="margin-top:16px;font-size:13px">Demo — <b>demo</b> / <b>demo</b></div>
    </div>
  </div>
</template>
