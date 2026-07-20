<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const p = ref({email:'',bio:'',role:''}); const out = ref(null); const err = ref('')
const ep = computed(()=> findEndpoint(props.view,'profile'))
async function save(){ const b={}; for(const k of ['email','bio','role']) if(p.value[k]) b[k]=p.value[k]; const r=await apiPatch(ep.value.p,b); out.value=r.data; err.value=r.ok?'':(r.data&&r.data.error)||'error' }

</script>
<template>
<section class="blk card pad" v-if="ep">
  <div class="blk-h">Profile</div>
  <input class="field" v-model="p.email" placeholder="email" /><input class="field" v-model="p.bio" placeholder="bio" /><input class="field" v-model="p.role" placeholder="role" /><button class="btn" @click="save">Save</button>
  <pre class="err" v-if="err">{{ err }}</pre>
  <pre class="out" v-if="out">{{ JSON.stringify(out,null,2) }}</pre>
</section>
</template>
