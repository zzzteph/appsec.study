<template>
  <div>
    <header class="hero">
      <div class="wrap">
        <h1>Boutique stays, effortless booking</h1>
        <p>Handpicked rooms and suites with FrontDesk loyalty perks.</p>
        <div class="searchbar">
          <div><label>Guests</label><select v-model="guests"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
          <div><label>Max nightly</label><input v-model="max" type="number" placeholder="1000" /></div>
          <div><label>Style</label><select v-model="kind"><option value="">Any</option><option value="room">Rooms</option><option value="suite">Suites</option></select></div>
          <div style="display:flex;align-items:flex-end"><button @click="run">Search</button></div>
        </div>
      </div>
    </header>
    <section class="section wrap">
      <div class="row" style="margin-bottom:16px"><h2 style="margin:0">Available stays</h2><span class="spacer"></span><span class="muted">{{ shown.length }} results</span></div>
      <div class="grid">
        <router-link v-for="r in shown" :key="r.id" :to="'/rooms/'+r.id" class="card">
          <div class="ph" :style="{background: grad(r.code)}"></div>
          <div class="bd">
            <div class="row"><h3>{{ r.name }}</h3><span class="spacer"></span><span class="pill">Sleeps {{ r.sleeps }}</span></div>
            <p class="muted" style="min-height:42px">{{ r.blurb }}</p>
            <div class="row"><span class="price">{{ money(r.price) }}</span><span class="muted">/ night</span></div>
          </div>
        </router-link>
      </div>
    </section>
    <div class="wrap"><div class="foot">FrontDesk · served through FrontDesk Edge · {{ cfg.currency || 'USD' }} · support at {{ cfg.supportUrl || '/support' }}</div></div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { get } from '../api'
import { grad, money } from '../assets/art.js'
const rooms = ref([]); const guests = ref('1'); const max = ref(''); const kind = ref(''); const cfg = ref({})
const shown = computed(() => rooms.value.filter(r => (!kind.value || r.kind === kind.value) && r.sleeps >= (+guests.value || 1) && (!max.value || r.price <= +max.value)))
async function run(){ rooms.value = await get('/rooms') }
onMounted(async () => { rooms.value = await get('/rooms'); try { cfg.value = await get('/config') } catch {} })
</script>
