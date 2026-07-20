<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const lg = ref({username:'me',password:'pw12345',remember:''}); const rg = ref({username:'me'+Math.floor(Math.random()*9999),password:'pw12345',role:''}); const out = ref(null); const err = ref('')
const loginEp = computed(()=> findEndpoint(props.view,'login')); const regEp = computed(()=> findEndpoint(props.view,'register'))
function stash(d,h){ if(d&&d.token) state.token=d.token; if(d&&d.apiKey) state.token=d.apiKey; const sc=h&&(h.get?h.get('set-cookie'):h['set-cookie']); if(sc){const m=String(sc).match(/maze_sid=([^;]+)/); if(m) state.session=m[1]} }
async function login(){ const b={username:lg.value.username,password:lg.value.password}; if(lg.value.remember)b.remember=lg.value.remember; const r=await apiPost(loginEp.value.p,b); out.value=r.data; err.value=r.ok?'':(r.data&&r.data.error)||'error'; if(r.ok) stash(r.data,r.headers) }
async function register(){ const b={username:rg.value.username,password:rg.value.password}; if(rg.value.role)b.role=rg.value.role; const r=await apiPost(regEp.value.p,b); out.value=r.data; err.value=r.ok?'':(r.data&&r.data.error)||'error' }

</script>
<template>
<section class="blk card pad" v-if="loginEp || regEp">
  <div class="blk-h">Account</div>
  <div class="grid2">
    <div v-if="loginEp"><b>Sign in</b><input class="field" v-model="lg.username" /><input class="field" type="password" v-model="lg.password" /><input class="field" v-model="lg.remember" placeholder="remember (1)" /><button class="btn accent" @click="login">Sign in</button></div>
    <div v-if="regEp"><b>Register</b><input class="field" v-model="rg.username" /><input class="field" v-model="rg.password" /><input class="field" v-model="rg.role" placeholder="role" /><button class="btn" @click="register">Create</button></div>
  </div>
  <pre class="err" v-if="err">{{ err }}</pre>
  <pre class="out" v-if="out">{{ JSON.stringify(out,null,2) }}</pre>
</section>
</template>
<style scoped>.grid2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}@media(max-width:640px){.grid2{grid-template-columns:1fr}}</style>
