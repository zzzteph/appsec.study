<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../api'
import { avatar } from '../assets/art'
const tiers = ref([]); const board = ref([])
onMounted(async () => { tiers.value = await get('/vip'); board.value = await get('/leaderboard') })
</script>

<template>
  <h1>VIP Club</h1>
  <div class="grid g4">
    <div v-for="t in tiers" :key="t.tier" class="card center" style="flex-direction:column;text-align:center">
      <span class="badge" :class="t.tier" style="font-size:13px;padding:6px 14px">{{ t.tier }}</span>
      <div class="stat" style="align-items:center;margin:12px 0"><div class="n gold">{{ t.cashback }}</div><div class="l">cashback</div></div>
      <ul class="muted" style="font-size:13px;padding-left:16px;text-align:left">
        <li v-for="p in t.perks" :key="p">{{ p }}</li>
      </ul>
    </div>
  </div>

  <div class="card" style="margin-top:20px">
    <h3>🏆 Leaderboard</h3>
    <table>
      <thead><tr><th>#</th><th>Player</th><th>Tier</th><th>Country</th></tr></thead>
      <tbody>
        <tr v-for="(p, i) in board" :key="i">
          <td><b>{{ i + 1 }}</b></td>
          <td><div class="row"><img class="avatar" :src="avatar(p.display_name, 28)" width="28" height="28" />{{ p.display_name }}</div></td>
          <td><span class="badge" :class="p.vip_tier">{{ p.vip_tier }}</span></td><td class="muted">{{ p.country }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
