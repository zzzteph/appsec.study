<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { post, setAuth } from '../api'
import { logo } from '../assets/art'
const route = useRoute(); const router = useRouter()
const tab = ref('login'); const f = ref({ username: '', email: '', password: '', name: '' }); const err = ref(''); const busy = ref(false)
async function submit() { err.value = ''; busy.value = true; try { const d = await post(tab.value === 'login' ? '/auth/login' : '/auth/register', f.value); setAuth(d.access, d.user); router.push(route.query.next || '/') } catch (e) { err.value = e.message } finally { busy.value = false } }
</script>
<template>
  <div class="auth">
    <div class="box">
      <div class="center" style="flex-direction:column;gap:8px;margin-bottom:22px"><img :src="logo(52)" width="52" height="52" /><h1 style="margin:0">Nimbus</h1><div class="muted">Cloud storage & sharing</div></div>
      <div class="card">
        <div class="tabs"><button :class="{ active: tab === 'login' }" @click="tab = 'login'">Sign in</button><button :class="{ active: tab === 'register' }" @click="tab = 'register'">Sign up</button></div>
        <form @submit.prevent="submit">
          <div class="field"><label>Username</label><input v-model="f.username" autocomplete="username" /></div>
          <div v-if="tab === 'register'" class="field"><label>Name</label><input v-model="f.name" /></div>
          <div v-if="tab === 'register'" class="field"><label>Email</label><input v-model="f.email" type="email" /></div>
          <div class="field"><label>Password</label><input v-model="f.password" type="password" autocomplete="current-password" /></div>
          <div v-if="err" class="err-inline" style="margin-bottom:10px">{{ err }}</div>
          <button class="btn primary" style="width:100%" :disabled="busy">{{ busy ? '…' : (tab === 'login' ? 'Sign in' : 'Create account') }}</button>
        </form>
      </div>
      <div class="center muted" style="margin-top:16px;font-size:13px">Demo — <b>demo</b> / <b>demo</b></div>
    </div>
  </div>
</template>
