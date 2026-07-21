<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { get, post, currentUser } from '../api'
import { tile } from '../assets/art'
import * as fair from '../lib/fair'

const route = useRoute()
const game = ref(null); const wallet = ref(null); const err = ref(''); const msg = ref('')
const stake = ref(5)
const isCrash = computed(() => route.params.slug === 'crash')

// crash animation
const mult = ref(1.0); const running = ref(false); let raf
const seeds = ref(null); const predicted = ref(null)

async function load() {
  game.value = await get('/games/' + route.params.slug)
  wallet.value = await get('/wallet')
  try { seeds.value = await get('/games/fair/seeds') } catch {}
}
onMounted(load)
onUnmounted(() => cancelAnimationFrame(raf))

function startCrash() {
  err.value = ''; msg.value = ''; running.value = true; mult.value = 1.0
  const t0 = performance.now()
  const step = (t) => {
    mult.value = +(1 + Math.pow((t - t0) / 1000, 1.35) * 0.6).toFixed(2)
    if (running.value) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}
async function cashout() {
  running.value = false; cancelAnimationFrame(raf)
  try {
    const d = await post('/games/crash/settle', { stake: Number(stake.value), cashoutMultiplier: mult.value })
    msg.value = `Cashed out at ${d.multiplier}× — won ${d.payout} RC`
    wallet.value = await get('/wallet')
  } catch (e) { err.value = e.message }
}
async function quickBet() {
  err.value = ''; msg.value = ''
  try {
    const d = await post('/games/' + route.params.slug + '/bet', { stake: Number(stake.value) })
    msg.value = d.payout > 0 ? `You won ${d.payout} RC! (roll ${d.outcome.roll.toFixed(4)})` : `No win this round (roll ${d.outcome.roll.toFixed(4)})`
    wallet.value = await get('/wallet'); if (seeds.value) seeds.value = await get('/games/fair/seeds')
  } catch (e) { err.value = e.message }
}
async function predictNext() {
  const uid = currentUser().id
  const ss = await fair.serverSeed(uid, seeds.value.nonce)
  const r = await fair.roll(ss, seeds.value.client_seed, seeds.value.nonce)
  predicted.value = { server_seed: ss, roll: r.toFixed(6), crash: fair.crashPoint(r).toFixed(2) }
}
</script>

<template>
  <div v-if="game" class="grid" style="grid-template-columns:1.6fr 1fr;gap:20px;align-items:start">
    <div class="card">
      <div class="row" style="margin-bottom:14px">
        <img :src="tile(game.tile)" width="52" height="70" style="border-radius:10px" />
        <div><h2 style="margin:0">{{ game.name }}</h2><span class="muted">{{ game.provider }} · {{ game.rtp }}% RTP</span></div>
        <span class="grow"></span><span class="badge diamond">{{ game.category }}</span>
      </div>

      <div v-if="isCrash" class="center" style="flex-direction:column;background:#07071a;border-radius:16px;padding:40px;border:1px solid var(--line)">
        <div style="font-size:64px;font-weight:900" :class="running ? 'green' : ''">{{ mult.toFixed(2) }}×</div>
        <div class="row" style="margin-top:16px">
          <button v-if="!running" class="btn primary" @click="startCrash">Place bet — {{ stake }} RC</button>
          <button v-else class="btn gold" @click="cashout">Cash out {{ (stake * mult).toFixed(2) }} RC</button>
        </div>
      </div>
      <div v-else class="center" style="flex-direction:column;background:#07071a;border-radius:16px;padding:44px;border:1px solid var(--line)">
        <img :src="tile(game.tile)" width="120" height="160" style="border-radius:14px" />
        <button class="btn primary" style="margin-top:18px" @click="quickBet">Bet {{ stake }} RC</button>
      </div>

      <div class="row" style="margin-top:16px">
        <div class="field grow" style="margin:0"><label>Bet amount (RC)</label><input v-model="stake" type="number" step="0.1" /></div>
        <div class="pill bal" style="align-self:flex-end">🪙 {{ wallet?.balance?.toFixed(2) }} RC</div>
      </div>
      <div v-if="msg" class="badge ok" style="margin-top:12px">{{ msg }}</div>
      <div v-if="err" class="err-inline" style="margin-top:12px">{{ err }}</div>
    </div>

    <div class="card">
      <h3>🔒 Provably Fair</h3>
      <p class="muted" style="font-size:13px">Every round is generated from a server seed and your client seed. Verify any result yourself.</p>
      <template v-if="seeds">
        <div class="field" style="margin:0 0 8px"><label>Client seed</label><input :value="seeds.client_seed" readonly /></div>
        <div class="row" style="gap:16px;font-size:13px;margin-bottom:8px">
          <span class="muted">Nonce</span><b>{{ seeds.nonce }}</b>
        </div>
        <div class="field"><label>Next server-seed hash</label><input class="mono" :value="seeds.next_server_seed_hash" readonly /></div>
        <button class="btn sm" @click="predictNext">Verify next round</button>
        <div v-if="predicted" class="result mono" style="margin-top:10px">roll = {{ predicted.roll }}
crash = {{ predicted.crash }}×
server_seed = {{ predicted.server_seed.slice(0, 24) }}…</div>
      </template>
    </div>
  </div>
</template>
