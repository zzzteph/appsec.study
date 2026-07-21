<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { get } from '../api'
import { tile, heroArt, avatar } from '../assets/art'

const router = useRouter()
const games = ref([]); const feed = ref([]); const promos = ref([])
const jackpot = ref(1284530.75)
let timer
onMounted(async () => {
  try { games.value = await get('/games') } catch {}
  try { feed.value = await get('/feed') } catch {}
  try { promos.value = await get('/promos') } catch {}
  timer = setInterval(() => { jackpot.value += Math.random() * 40 }, 1200)
})
onUnmounted(() => clearInterval(timer))
const cats = ['slots', 'instant', 'table', 'lottery']
const byCat = (c) => games.value.filter(g => g.category === c)
</script>

<template>
  <div class="grid" style="gap:22px">
    <section class="hero">
      <img class="art" :src="heroArt()" />
      <div style="position:relative;max-width:60%">
        <div class="badge gold" style="margin-bottom:10px">🔥 Mega Jackpot</div>
        <div class="jackpot">{{ jackpot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} RC</div>
        <h1 style="margin-top:6px">Welcome to RollHouse</h1>
        <p style="opacity:.9;max-width:440px">Deposit, spin, and cash out. 200+ games, provably fair, instant payouts.</p>
        <button class="btn" style="background:#fff;color:#7a1450" @click="router.push('/game/crash')">▶ Play Crash</button>
      </div>
    </section>

    <section v-if="promos.length">
      <h2>Promotions</h2>
      <div class="grid g3">
        <div v-for="p in promos.slice(0,3)" :key="p.code" class="card tight" style="border-left:3px solid var(--gold)">
          <div class="row"><b class="gold">{{ p.code }}</b><span class="grow"></span><span class="badge warn">{{ p.kind }}</span></div>
          <div class="muted" style="font-size:13px;margin-top:6px">{{ p.description }}</div>
          <button class="btn sm primary" style="margin-top:10px" @click="router.push('/promotions')">Claim</button>
        </div>
      </div>
    </section>

    <section>
      <div class="row"><h2 style="margin:0">Popular games</h2><span class="grow"></span></div>
      <div class="tiles" style="margin-top:12px">
        <div v-for="g in games.filter(x => x.popular)" :key="g.slug" class="tile" @click="router.push('/game/' + g.slug)">
          <img class="thumb" :src="tile(g.tile)" />
          <span v-if="g.popular" class="hot badge gold">HOT</span>
          <div class="meta"><b>{{ g.name }}</b><div class="muted" style="font-size:11px">{{ g.provider }} · {{ g.rtp }}% RTP</div></div>
        </div>
      </div>
    </section>

    <section v-for="c in cats" :key="c" v-show="byCat(c).length">
      <h2 style="text-transform:capitalize">{{ c }}</h2>
      <div class="tiles">
        <div v-for="g in byCat(c)" :key="g.slug" class="tile" @click="router.push('/game/' + g.slug)">
          <img class="thumb" :src="tile(g.tile)" />
          <div class="meta"><b>{{ g.name }}</b><div class="muted" style="font-size:11px">{{ g.rtp }}% RTP</div></div>
        </div>
      </div>
    </section>

    <section v-if="feed.length">
      <h2>🏆 Recent big wins</h2>
      <div class="card">
        <div v-for="w in feed" :key="w.id" class="row chatline">
          <img class="avatar" :src="avatar(w.username, 30)" width="30" height="30" />
          <b>{{ w.username }}</b><span class="muted">won on {{ w.game }}</span>
          <span class="grow"></span><b class="green">+{{ w.amount }} RC</b>
        </div>
      </div>
    </section>
  </div>
</template>
