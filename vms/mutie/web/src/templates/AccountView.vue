<script setup>
// account kind — register / login / reset / profile / user-lookup / optional import-job.
import { ref } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, fillPath, findAllEndpoints } from '../lib/store'

const props = defineProps({ view: Object, layout: Number, widget: String })
const reg = ref({ username: 'me' + Math.floor(Math.random() * 10000), password: 'pw12345', role: '' })
const lgn = ref({ username: 'me', password: 'pw12345' })
const rst = ref({ username: 'root_admin', token: '', password: 'new-pw' })
const prof = ref({ email: '', bio: '', role: '' })
const lookup = ref('root_admin')
const result = ref(null); const err = ref(''); const job = ref('{}')

function stash(resp, hdrs) {
  const d = resp
  if (d && d.token) state.token = d.token
  if (d && d.apiKey) state.token = d.apiKey
  const set = hdrs && (hdrs.get ? hdrs.get('set-cookie') : hdrs['set-cookie'])
  if (set) { const m = String(set).match(/mutie_sid=([^;]+)/); if (m) state.session = m[1] }
}

async function register() {
  const ep = findEndpoint(props.view, 'register'); if (!ep) return
  const b = { username: reg.value.username, password: reg.value.password }; if (reg.value.role) b.role = reg.value.role
  const r = await apiPost(ep.p, b); result.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
}
async function login() {
  const ep = findEndpoint(props.view, 'login'); if (!ep) return
  const r = await apiPost(ep.p, lgn.value); result.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
  if (r.ok) stash(r.data, r.headers)
}
async function reset() {
  const ep = findEndpoint(props.view, 'reset'); if (!ep) return
  const r = await apiPost(ep.p, { username: rst.value.username }); result.value = r.data
  if (r.data && r.data.token) rst.value.token = r.data.token
}
async function confirmReset() {
  const ep = findEndpoint(props.view, 'reset-confirm'); if (!ep) return
  const r = await apiPost(ep.p, rst.value); result.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
}
async function patchProfile() {
  const ep = findEndpoint(props.view, 'profile'); if (!ep) return
  const b = {}; if (prof.value.email) b.email = prof.value.email; if (prof.value.bio) b.bio = prof.value.bio; if (prof.value.role) b.role = prof.value.role
  const r = await apiPatch(ep.p, b); result.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
}
async function lookupUser() {
  const ep = findEndpoint(props.view, 'user-lookup'); if (!ep) return
  const r = await apiGet(fillPath(ep.p, { username: lookup.value })); result.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
}
async function importJob() {
  const ep = findEndpoint(props.view, 'import-job'); if (!ep) return
  const r = await apiPost(ep.p, { job: job.value }); result.value = r.data; err.value = r.ok ? '' : (r.data && r.data.error) || 'error'
}
</script>
<template>
<div>
  <div v-if="layout === 0" class="grid" style="grid-template-columns: 1fr 1fr; gap:1rem">
    <div class="card pad">
      <b>Sign up</b>
      <input class="field" v-model="reg.username" placeholder="username" />
      <input class="field" v-model="reg.password" placeholder="password" type="password" />
      <input class="field" v-model="reg.role" placeholder="role (leave blank for default)" />
      <button class="btn" @click="register">Create account</button>
    </div>
    <div class="card pad">
      <b>Sign in</b>
      <input class="field" v-model="lgn.username" placeholder="username" />
      <input class="field" v-model="lgn.password" placeholder="password" type="password" />
      <button class="btn accent" @click="login">Sign in</button>
    </div>
    <div class="card pad" v-if="(view.endpoints || []).some(e => e.kind === 'profile')">
      <b>Profile</b>
      <label class="lbl">Email</label><input class="field" v-model="prof.email" />
      <label class="lbl">Bio</label><textarea class="field" rows="2" v-model="prof.bio"></textarea>
      <label class="lbl">Role</label><input class="field" v-model="prof.role" />
      <button class="btn" @click="patchProfile">Save profile</button>
    </div>
    <div class="card pad" v-if="(view.endpoints || []).some(e => e.kind === 'reset')">
      <b>Reset password</b>
      <input class="field" v-model="rst.username" />
      <button class="btn flat" @click="reset">Send reset</button>
      <input class="field" v-model="rst.token" placeholder="reset token" />
      <input class="field" v-model="rst.password" placeholder="new password" />
      <button class="btn" @click="confirmReset">Confirm</button>
    </div>
    <div class="card pad" v-if="(view.endpoints || []).some(e => e.kind === 'user-lookup')">
      <b>Look up a user</b>
      <div class="row"><input class="field" v-model="lookup" /><button class="btn flat" @click="lookupUser">Find</button></div>
    </div>
    <div class="card pad" v-if="(view.endpoints || []).some(e => e.kind === 'import-job')">
      <b>Import job</b>
      <textarea class="field" rows="4" v-model="job"></textarea>
      <button class="btn accent" @click="importJob">Import</button>
    </div>
  </div>

  <div v-else-if="layout === 1">
    <div class="hero"><img :src="'https://picsum.photos/seed/mt-' + view.id + '/1200/220'" /><div class="cap"><h1>Welcome</h1><p>Sign in or create an account.</p></div></div>
    <div class="grid" style="grid-template-columns: 1fr 1fr; gap:1rem;margin-top:1rem">
      <div class="card pad">
        <b>Sign in</b>
        <input class="field" v-model="lgn.username" /><input class="field" v-model="lgn.password" type="password" />
        <button class="btn accent" @click="login">Sign in</button>
      </div>
      <div class="card pad">
        <b>New here?</b>
        <input class="field" v-model="reg.username" /><input class="field" v-model="reg.password" type="password" /><input class="field" v-model="reg.role" placeholder="role" />
        <button class="btn" @click="register">Create account</button>
      </div>
    </div>
    <div class="card pad" style="margin-top:1rem" v-if="(view.endpoints || []).some(e => e.kind === 'user-lookup')">
      <b>Directory</b>
      <div class="row"><input class="field" v-model="lookup" /><button class="btn" @click="lookupUser">Find</button></div>
    </div>
  </div>

  <div v-else-if="layout === 2">
    <div class="metrics">
      <div class="card metric"><div class="n">1</div><div class="l">tenant</div></div>
      <div class="card metric"><div class="n">🔑</div><div class="l">{{ state.manifest && state.manifest.auth }}</div></div>
    </div>
    <div class="card pad" style="margin-top:1rem">
      <div class="subtabs">
        <button class="on">Sign in</button><button>Register</button><button>Reset</button>
      </div>
      <input class="field" v-model="lgn.username" /><input class="field" v-model="lgn.password" type="password" /><button class="btn" @click="login">Sign in</button>
      <hr /><input class="field" v-model="reg.username" /><input class="field" v-model="reg.password" type="password" /><input class="field" v-model="reg.role" /><button class="btn" @click="register">Register</button>
      <hr /><input class="field" v-model="rst.username" /><button class="btn flat" @click="reset">Reset</button>
      <input class="field" v-model="rst.token" /><input class="field" v-model="rst.password" /><button class="btn" @click="confirmReset">Confirm</button>
    </div>
    <div class="card pad" style="margin-top:1rem" v-if="(view.endpoints || []).some(e => e.kind === 'user-lookup')">
      <input class="field" v-model="lookup" /><button class="btn flat" @click="lookupUser">Look up</button>
    </div>
    <div class="card pad" style="margin-top:1rem" v-if="(view.endpoints || []).some(e => e.kind === 'import-job')">
      <b>Job importer</b><textarea class="field" rows="3" v-model="job"></textarea><button class="btn" @click="importJob">Import</button>
    </div>
  </div>

  <div v-else-if="layout === 3">
    <div class="card pad">
      <h3>Your workspace</h3>
      <label class="lbl">Email</label><input class="field" v-model="prof.email" />
      <label class="lbl">Bio</label><textarea class="field" rows="3" v-model="prof.bio"></textarea>
      <label class="lbl">Role</label><input class="field" v-model="prof.role" />
      <div class="row"><button class="btn" @click="patchProfile">Save</button></div>
    </div>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem">
      <div class="card pad">
        <b>Log in</b>
        <input class="field" v-model="lgn.username" /><input class="field" v-model="lgn.password" type="password" /><button class="btn accent" @click="login">Sign in</button>
      </div>
      <div class="card pad">
        <b>Register</b>
        <input class="field" v-model="reg.username" /><input class="field" v-model="reg.password" type="password" /><input class="field" v-model="reg.role" /><button class="btn" @click="register">Create</button>
      </div>
    </div>
    <div class="card pad" style="margin-top:1rem" v-if="(view.endpoints || []).some(e => e.kind === 'reset')">
      <b>Reset</b>
      <input class="field" v-model="rst.username" /><button class="btn flat" @click="reset">Request</button>
      <input class="field" v-model="rst.token" /><input class="field" v-model="rst.password" /><button class="btn" @click="confirmReset">Confirm</button>
    </div>
    <div class="card pad" style="margin-top:1rem" v-if="(view.endpoints || []).some(e => e.kind === 'user-lookup')">
      <b>User lookup</b>
      <div class="row"><input class="field" v-model="lookup" /><button class="btn" @click="lookupUser">Find</button></div>
    </div>
  </div>

  <div v-else>
    <!-- 4 : all-in-one column -->
    <div class="card pad">
      <div class="subtabs"><button class="on">All</button></div>
      <b>Sign in</b><div class="row"><input class="field" v-model="lgn.username" /><input class="field" v-model="lgn.password" type="password" /><button class="btn" @click="login">Login</button></div>
      <b>Register</b><div class="row"><input class="field" v-model="reg.username" /><input class="field" v-model="reg.password" /><input class="field" v-model="reg.role" placeholder="role" /><button class="btn" @click="register">Register</button></div>
      <b>Reset</b><div class="row"><input class="field" v-model="rst.username" /><button class="btn flat" @click="reset">Reset</button><input class="field" v-model="rst.token" placeholder="token" /><input class="field" v-model="rst.password" placeholder="new-pw" /><button class="btn" @click="confirmReset">Confirm</button></div>
      <b>Profile</b><div class="row"><input class="field" v-model="prof.email" placeholder="email" /><input class="field" v-model="prof.bio" placeholder="bio" /><input class="field" v-model="prof.role" placeholder="role" /><button class="btn" @click="patchProfile">Save</button></div>
      <b v-if="(view.endpoints || []).some(e => e.kind === 'user-lookup')">Lookup</b><div v-if="(view.endpoints || []).some(e => e.kind === 'user-lookup')" class="row"><input class="field" v-model="lookup" /><button class="btn" @click="lookupUser">Find</button></div>
      <b v-if="(view.endpoints || []).some(e => e.kind === 'import-job')">Job</b><div v-if="(view.endpoints || []).some(e => e.kind === 'import-job')"><textarea class="field" v-model="job" rows="3"></textarea><button class="btn accent" @click="importJob">Import</button></div>
    </div>
  </div>

  <div class="card pad" v-if="err || result" style="margin-top:1rem">
    <pre class="err" v-if="err">{{ err }}</pre>
    <pre class="out" v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
  </div>
</div>
</template>
