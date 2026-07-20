<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const u = ref('root_admin'); const out = ref(null)
const lookupEp = computed(()=> findEndpoint(props.view,'user-lookup')); const loginAsEp = computed(()=> findEndpoint(props.view,'login-as')); const writeEp = computed(()=> findEndpoint(props.view,'profile-write'))
async function find(){ const r=await apiGet(fillPath(lookupEp.value.p,{username:u.value})); out.value=r.data }
async function loginAs(){ const r=await apiPost(loginAsEp.value.p,{username:u.value}); out.value=r.data; if(r.data&&r.data.token) state.token=r.data.token }
async function write(){ const r=await apiPost(writeEp.value.p,{username:u.value,password:'pwned123'}); out.value=r.data }

</script>
<template>
<section class="blk card pad" v-if="lookupEp || loginAsEp || writeEp">
  <div class="blk-h">Directory</div>
  <div class="row"><input class="field" v-model="u" /><button class="btn flat" v-if="lookupEp" @click="find">Find</button><button class="btn flat" v-if="loginAsEp" @click="loginAs">Login as</button><button class="btn flat" v-if="writeEp" @click="write">Set pw</button></div>
  <pre class="out" v-if="out">{{ JSON.stringify(out,null,2) }}</pre>
</section>
</template>
