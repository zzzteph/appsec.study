<template>
  <div class="section wrap">
    <h2>My account</h2>
    <div class="card" style="margin-bottom:18px" v-if="acct"><div class="bd">
      <h3 style="margin-top:0">Profile</h3>
      <div class="kv">
        <div>Name</div><div>{{ acct.profile.name }}</div>
        <div>Email</div><div>{{ acct.profile.email }}</div>
        <div>Phone</div><div>{{ acct.profile.phone }}</div>
        <div>Loyalty tier</div><div><span class="pill" :class="{gold: acct.profile.tier==='Gold'}">{{ acct.profile.tier }}</span></div>
      </div>
    </div></div>

    <div class="card"><div class="bd">
      <h3 style="margin-top:0">My trips</h3>
      <table v-if="acct && acct.reservations.length">
        <thead><tr><th>#</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Status</th><th>Card</th><th>Total</th></tr></thead>
        <tbody><tr v-for="r in acct.reservations" :key="r.id">
          <td>{{ r.id }}</td><td>{{ roomName(r.room_id) }}</td><td>{{ r.checkin }}</td><td>{{ r.checkout }}</td>
          <td><span class="pill">{{ r.status }}</span></td><td class="muted">•••• {{ r.card_last4 }}</td><td>{{ money(r.total) }}</td>
        </tr></tbody>
      </table>
      <div v-else class="muted">No trips yet — browse stays to book one.</div>
    </div></div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../api'
import { money } from '../assets/art.js'
const acct = ref(null); const rooms = ref([])
const roomName = (id) => (rooms.value.find(r => r.id === id) || {}).name || ('Room ' + id)
onMounted(async () => { rooms.value = await get('/rooms'); acct.value = await get('/account') })
</script>
