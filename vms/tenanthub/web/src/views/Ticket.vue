<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get, post } from '../api'
import { avatar } from '../assets/art'

const route = useRoute()
const ticket = ref(null); const comments = ref([]); const body = ref('')
async function load() {
  ticket.value = await get('/tickets/' + route.params.id)
  comments.value = await get('/tickets/' + route.params.id + '/comments')
}
onMounted(load)
async function add() {
  if (!body.value.trim()) return
  await post('/tickets/' + route.params.id + '/comments', { body: body.value }); body.value = ''
  comments.value = await get('/tickets/' + route.params.id + '/comments')
}
</script>

<template>
  <div v-if="ticket">
    <div class="row" style="margin-bottom:6px"><h1 style="margin:0">{{ ticket.title }}</h1>
      <span class="badge open">{{ ticket.status }}</span><span class="badge" :class="ticket.priority==='critical'?'crit':'warn'">{{ ticket.priority }}</span></div>
    <div class="card" style="margin:14px 0"><p style="white-space:pre-wrap">{{ ticket.body }}</p></div>

    <div class="card">
      <h3>Comments</h3>
      <!-- comment bodies rendered as rich content -->
      <div v-for="c in comments" :key="c.id" class="comment row" style="align-items:flex-start">
        <img class="avatar" :src="avatar(c.author_name, 28)" width="28" height="28" />
        <div><b>{{ c.author_name }}</b> <span class="muted" style="font-size:12px">{{ c.created }}</span><div v-html="c.body"></div></div>
      </div>
      <div class="row" style="margin-top:12px"><input v-model="body" placeholder="Add a comment…" style="flex:1" @keyup.enter="add" /><button class="btn primary" @click="add">Comment</button></div>
    </div>
  </div>
</template>
