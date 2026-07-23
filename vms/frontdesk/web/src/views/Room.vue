<template>
  <div class="section wrap" v-if="room">
    <router-link to="/" class="muted">← All stays</router-link>
    <div class="card" style="margin-top:12px">
      <div class="ph" :style="{background: grad(room.code), height:'220px'}"></div>
      <div class="bd">
        <div class="row"><h2 style="margin:0">{{ room.name }}</h2><span class="spacer"></span><span class="price">{{ money(room.price) }}<span class="muted" style="font-weight:400">/night</span></span></div>
        <p class="muted">{{ room.blurb }}</p>
        <div class="row" style="gap:8px"><span class="pill">{{ room.kind }}</span><span class="pill">Sleeps {{ room.sleeps }}</span><span class="pill">Code {{ room.code }}</span></div>
      </div>
    </div>

    <div class="card" style="margin-top:18px"><div class="bd">
      <h3 style="margin-top:0">Book this stay</h3>
      <div class="searchbar" style="box-shadow:none;padding:0;background:transparent;grid-template-columns:1fr 1fr 1fr auto">
        <div><label>Check-in</label><input v-model="checkin" type="date" /></div>
        <div><label>Check-out</label><input v-model="checkout" type="date" /></div>
        <div><label>Guests</label><select v-model="guests"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
        <div style="display:flex;align-items:flex-end"><button @click="book">Reserve</button></div>
      </div>
      <p v-if="msg" class="muted" style="margin-top:10px">{{ msg }}</p>
    </div></div>

    <div class="card" style="margin-top:18px"><div class="bd">
      <h3 style="margin-top:0">Guest reviews</h3>
      <div v-for="(rv,i) in reviews" :key="i" class="rev">
        <div class="row"><strong>{{ rv.author }}</strong><span class="stars">{{ '★'.repeat(rv.stars) }}</span><span class="spacer"></span><span class="muted">{{ rv.created }}</span></div>
        <div>{{ rv.body }}</div>
      </div>
      <div v-if="!reviews.length" class="muted">No reviews yet.</div>
    </div></div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { get, post } from '../api'
import { grad, money } from '../assets/art.js'
const route = useRoute()
const room = ref(null); const reviews = ref([]); const checkin = ref(''); const checkout = ref(''); const guests = ref('2'); const msg = ref('')
async function book(){ msg.value=''; try { const r = await post('/reservations', { room_id: room.value.id, checkin: checkin.value, checkout: checkout.value, guests: +guests.value }); msg.value = 'Reserved! Confirmation #' + r.id + '. See it under My trips.' } catch(e){ msg.value = e.message } }
onMounted(async () => { room.value = await get('/rooms/' + route.params.id); reviews.value = await get('/rooms/' + route.params.id + '/reviews') })
</script>
