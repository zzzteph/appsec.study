<script setup>
import { state } from '../lib/store'
</script>
<template>
  <div class="authpanel">
    <input class="tok" v-model="state.token" placeholder="bearer / apikey" />
    <input class="tok" v-model="state.session" placeholder="session sid" />
  </div>
</template>
<style scoped>
.authpanel { display: flex; gap: .4rem; }
.tok { width: 160px; padding: .38rem .6rem; border: 0; border-radius: 4px; background: rgba(255,255,255,.16); color: #fff; font: inherit; font-size: .82rem; }
.tok::placeholder { color: rgba(255,255,255,.7); }
@media (max-width: 720px) {
  .tok { width: 100px; }
}
</style>
