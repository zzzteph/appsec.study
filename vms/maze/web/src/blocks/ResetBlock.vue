<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const r = ref({username:'root_admin',token:'',password:'new-pw'}); const out = ref(null)
const resetEp = computed(()=> findEndpoint(props.view,'reset')); const confEp = computed(()=> findEndpoint(props.view,'reset-confirm'))
async function req(){ const x=await apiPost(resetEp.value.p,{username:r.value.username}); out.value=x.data; if(x.data&&x.data.token) r.value.token=x.data.token }
async function conf(){ const x=await apiPost(confEp.value.p,r.value); out.value=x.data }

</script>
<template>
<section class="blk card pad" v-if="resetEp">
  <div class="blk-h">Password reset</div>
  <input class="field" v-model="r.username" /><button class="btn flat" @click="req">Request</button>
  <input class="field" v-model="r.token" placeholder="token" /><input class="field" v-model="r.password" /><button class="btn" @click="conf">Confirm</button>
  <pre class="out" v-if="out">{{ JSON.stringify(out,null,2) }}</pre>
</section>
</template>
