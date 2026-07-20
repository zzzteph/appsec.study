<script setup>
import { ref } from 'vue'
const email = ref('')
const done = ref(false)
const props = defineProps({ view: Object })

</script>
<template>
<section class="blk card pad">
  <div class="blk-h">Stay in the loop</div>
  <div class="row"><input class="field" v-model="email" placeholder="you@example.com" /><button class="btn accent" @click="done=true">Subscribe</button></div>
  <p class="muted" v-if="done">Thanks — you are subscribed.</p>
</section>
</template>
