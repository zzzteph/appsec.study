<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { post, get } from '../api'
import { logo } from '../assets/art'
const route = useRoute()
const info = ref(null); const pw = ref(''); const content = ref(''); const err = ref('')
onMounted(async () => { try { info.value = await get('/shares/' + route.params.token) } catch (e) { err.value = e.message } })
async function unlock() { err.value = ''; try { const d = await post('/shares/' + route.params.token + '/unlock', { password: pw.value }); content.value = d.content } catch (e) { err.value = e.message } }
</script>
<template>
  <div class="auth">
    <div class="box" style="max-width:520px">
      <div class="center" style="gap:8px;margin-bottom:18px"><img :src="logo(34)" width="34" height="34" /><b>Nimbus — shared file</b></div>
      <div v-if="err" class="card err-inline">{{ err }}</div>
      <div v-else-if="info" class="card">
        <h3>{{ info.file.name }}</h3>
        <div class="muted" style="font-size:13px">{{ info.file.mime }} · {{ info.file.size }} KB</div>
        <template v-if="info.has_password && !content">
          <div class="field" style="margin-top:14px"><label>This file is password-protected</label><input v-model="pw" type="password" placeholder="password" /></div>
          <button class="btn primary" @click="unlock">Unlock</button>
        </template>
        <button v-else-if="!content" class="btn primary" style="margin-top:12px" @click="unlock">View file</button>
        <div v-if="content" class="result" style="margin-top:12px">{{ content }}</div>
      </div>
    </div>
  </div>
</template>
