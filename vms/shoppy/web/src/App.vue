<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { api, get, post, patch, store, saveAuth, logout, isAuthed } from './api.js'

const route = ref(window.location.hash || '#/')
const onHash = () => { route.value = window.location.hash || '#/' }
onMounted(() => window.addEventListener('hashchange', onHash))
onUnmounted(() => window.removeEventListener('hashchange', onHash))
const path = computed(() => route.value.replace(/^#/, '').split('?')[0])
const authed = ref(isAuthed())
const msg = ref('')
function nav(h) { window.location.hash = h }
function flash(t) { msg.value = t; setTimeout(() => { if (msg.value === t) msg.value = '' }, 4000) }

const shops = ref([]); const shop = ref(null); const search = ref(''); const page = ref(1); const selected = reactive({})
const cart = ref(null); const orders = ref([]); const articles = ref([]); const me = ref(null); const invites = ref([]); const recent = ref([])
const auth = reactive({ username: '', password: '' })
const reset = reactive({ username: '', token: '', newPassword: '' })
const co = reactive({ number: '4242424242424242', exp: '12/29', cvc: '123', giftCardCode: '', total: '' })
const rev = reactive({ rating: 5, text: '' })
const art = reactive({ slug: '', question: '', answer: '' })
const prof = reactive({ username: '', address: '', password: '' })
const inviteUser = ref('')
const gift = reactive({ amount: 20, code: '' })
const xfer = reactive({ toUserId: '', amount: 5 })
const emailForm = reactive({ email: '', userId: '' })
const coupons = ref('')
const favorites = ref([])
const noteText = ref('')
const notesByOrder = reactive({})
const invoiceOut = ref('')
const tools = reactive({ loginAsId: '', webhookUrl: 'http://127.0.0.1:80/api/shops', upName: 'pwn.html', upContent: '<img src=x onerror=alert(1)>', shopId: 's1', itemName: 'Hacked Item', itemPrice: 0.01, updItemId: '', updItemPrice: '', updShopId: 's1', updShopName: '' })

async function loadShops() { shops.value = await get('/shops') }
async function loadShop(id) {
  const [meta, items, reviews] = await Promise.all([
    get('/shops/' + id),
    get('/items?shopId=' + id + '&search=' + encodeURIComponent(search.value || '') + '&page=' + page.value + '&pageSize=6'),
    get('/shops/' + id + '/reviews')
  ])
  shop.value = { ...meta, items, reviews }
}
async function loadCart() { cart.value = await get('/cart') }
async function loadOrders() { orders.value = await get('/orders') }
async function loadArticles() { articles.value = await get('/articles') }
async function loadMe() { me.value = await get('/me'); if (me.value) { prof.username = me.value.username; prof.address = me.value.address || '' } }
async function loadInvites() { if (me.value) invites.value = await get('/users/' + me.value.id + '/invitations') }
async function loadRecent() { recent.value = await get('/recent-users?limit=15') }

async function addToCart(item) {
  const c = await post('/cart/items', { itemId: item.id, optionIds: selected[item.id] || [] })
  store.cart = c.id; flash('Added to cart')
}
async function doCheckout() {
  try {
    const cps = coupons.value.split(',').map((s) => s.trim()).filter(Boolean)
    const o = await post('/checkout', { card: { number: co.number, exp: co.exp, cvc: co.cvc }, giftCardCode: co.giftCardCode || null, total: co.total === '' ? null : Number(co.total), coupons: cps.length ? cps : null })
    flash('Order ' + o.id + ' placed'); nav('#/orders')
  } catch (e) { flash(e.message) }
}
async function doAuth(kind) {
  try { const d = await post('/' + kind, { username: auth.username, password: auth.password }); saveAuth(d); authed.value = true; flash('Welcome ' + d.user.username); nav('#/') }
  catch (e) { flash(e.message) }
}
async function doReset(stage) {
  try {
    if (stage === 'request') { const d = await post('/password/forgot', { username: reset.username }); reset.token = d.token; flash('Reset token issued') }
    else { await post('/password/reset', { username: reset.username, token: reset.token, newPassword: reset.newPassword }); flash('Password reset'); nav('#/login') }
  } catch (e) { flash(e.message) }
}
async function addReview() {
  try { await post('/shops/' + shop.value.id + '/reviews', { rating: Number(rev.rating), text: rev.text }); rev.text = ''; await loadShop(shop.value.id); flash('Review posted') }
  catch (e) { flash(e.message) }
}
async function saveArticle() {
  try { await api('PUT', '/articles/' + art.slug, { question: art.question, answer: art.answer }); await loadArticles(); flash('Article saved') }
  catch (e) { flash(e.message) }
}
async function saveProfile() {
  try { await patch('/users/' + me.value.id, { username: prof.username, address: prof.address, password: prof.password || null }); prof.password = ''; await loadMe(); flash('Profile updated') }
  catch (e) { flash(e.message) }
}
async function doInvite() { try { await post('/invite', { username: inviteUser.value }); flash('invited ' + inviteUser.value) } catch (e) { flash(e.message) } }
const card = () => ({ number: co.number, exp: co.exp, cvc: co.cvc })
async function buyGiftCard() { try { const d = await post('/giftcards', { amount: Number(gift.amount), card: card() }); gift.code = d.code; flash('Gift card: ' + d.code) } catch (e) { flash(e.message) } }
async function redeemGiftCard() { try { await post('/giftcards/' + encodeURIComponent(gift.code) + '/redeem'); await loadMe(); flash('Redeemed') } catch (e) { flash(e.message) } }
async function doTransfer() { try { await post('/credits/transfer', { toUserId: xfer.toUserId, amount: Number(xfer.amount) }); await loadMe(); flash('Transferred') } catch (e) { flash(e.message) } }
async function doChangeEmail() { try { const uid = emailForm.userId || (me.value && me.value.id); await post('/users/' + uid + '/email', { email: emailForm.email }); flash('Email changed') } catch (e) { flash(e.message) } }
async function doBecomeSeller() { try { await post('/seller'); await loadMe(); flash('You are now a seller') } catch (e) { flash(e.message) } }
async function addFav(item) { try { await post('/favorites', { itemId: item.id }); flash('Favorited') } catch (e) { flash(e.message) } }
async function loadFav() { if (me.value) favorites.value = await get('/users/' + me.value.id + '/favorites') }
async function doRefund(o) { try { const d = await post('/orders/' + o.id + '/refund', {}); await loadOrders(); flash('Refunded $' + d.refunded) } catch (e) { flash(e.message) } }
async function doCancel(o) { try { await post('/orders/' + o.id + '/cancel', {}); await loadOrders(); flash('Cancelled') } catch (e) { flash(e.message) } }
async function loadNotes(o) { notesByOrder[o.id] = await get('/orders/' + o.id + '/notes') }
async function addNote(o) { try { await post('/orders/' + o.id + '/notes', { text: noteText.value }); noteText.value = ''; await loadNotes(o); flash('Note added') } catch (e) { flash(e.message) } }
async function getInvoice(o, file) { try { const url = '/api/orders/' + o.id + '/invoice' + (file ? ('?file=' + encodeURIComponent(file)) : ''); const r = await fetch(url, { headers: store.access ? { Authorization: 'Bearer ' + store.access } : {} }); invoiceOut.value = await r.text() } catch (e) { flash(e.message) } }
async function doLoginAs() { try { const d = await post('/login-as', { userId: tools.loginAsId }); saveAuth(d); authed.value = true; await loadMe(); flash('Now acting as ' + d.user.username) } catch (e) { flash(e.message) } }
async function doWebhook() { try { const d = await post('/webhooks', { url: tools.webhookUrl }); flash(JSON.stringify(d).slice(0, 140)) } catch (e) { flash(e.message) } }
async function doUpload() { try { const d = await post('/upload', { filename: tools.upName, contentBase64: btoa(tools.upContent) }); flash('Uploaded: ' + d.url) } catch (e) { flash(e.message) } }
async function doCreateItem() { try { await post('/items', { shopId: tools.shopId, name: tools.itemName, price: Number(tools.itemPrice) }); flash('Item created') } catch (e) { flash(e.message) } }
async function doUpdateItem() { try { await patch('/items/' + tools.updItemId, { price: tools.updItemPrice === '' ? null : Number(tools.updItemPrice) }); flash('Item updated') } catch (e) { flash(e.message) } }
async function doUpdateShop() { try { await patch('/shops/' + tools.updShopId, { name: tools.updShopName || null }); flash('Shop updated') } catch (e) { flash(e.message) } }
function toggleOpt(itemId, optId, ev) { selected[itemId] = selected[itemId] || []; if (ev.target.checked) selected[itemId].push(optId); else selected[itemId] = selected[itemId].filter((x) => x !== optId) }
function doLogout() { logout(); authed.value = false; me.value = null; nav('#/') }

let poll = null
watch(route, async () => {
  msg.value = ''
  const p = path.value
  try {
    if (p === '/' || p === '') await loadShops()
    else if (p.startsWith('/shop/')) { page.value = 1; await loadShop(p.split('/')[2]) }
    else if (p === '/cart') await loadCart()
    else if (p === '/orders') await loadOrders()
    else if (p === '/help') await loadArticles()
    else if (p === '/profile') { await loadMe(); await loadFav() }
    else if (p === '/invites') { await loadMe(); await loadInvites() }
    else if (p === '/admin') await loadRecent()
    else if (p === '/tools') await loadMe()
  } catch (e) { flash(e.message) }
  if (poll) { clearInterval(poll); poll = null }
  if (p === '/orders') poll = setInterval(loadOrders, 5000)
}, { immediate: true })

async function changePage(d) { page.value = Math.max(1, page.value + d); await loadShop(shop.value.id) }
async function runSearch() { page.value = 1; await loadShop(shop.value.id) }
</script>

<template>
  <div class="app">
    <nav>
      <a class="brand" href="#/">Shoppy</a>
      <a href="#/cart">Cart</a>
      <a href="#/help">Help</a>
      <template v-if="authed">
        <a href="#/orders">Orders</a><a href="#/invites">Invites</a><a href="#/tools">Tools</a><a href="#/profile">Profile</a>
        <a href="#" @click.prevent="doLogout">Logout</a>
      </template>
      <template v-else><a href="#/login">Login</a><a href="#/register">Register</a></template>
    </nav>
    <p v-if="msg" class="flash">{{ msg }}</p>

    <div class="wrap">
      <section v-if="path === '/' || path === ''">
        <h1>Shops</h1>
        <div v-for="s in shops" :key="s.id" class="card">
          <a :href="'#/shop/' + s.id"><h3>{{ s.name }}</h3></a>
          <p class="muted">{{ s.description }}</p>
        </div>
      </section>

      <section v-else-if="path.startsWith('/shop/') && shop">
        <h1>{{ shop.name }}</h1>
        <div class="row"><input v-model="search" placeholder="Search items…" @keyup.enter="runSearch" /><button @click="runSearch">Search</button></div>
        <div v-for="it in shop.items.items" :key="it.id" class="card">
          <h3>{{ it.name }} — <span class="price">${{ it.price.toFixed(2) }}</span></h3>
          <p class="muted">{{ it.description }}</p>
          <label v-for="o in it.options" :key="o.id" class="opt">
            <input type="checkbox" @change="toggleOpt(it.id, o.id, $event)" /> {{ o.group }}: {{ o.name }} ({{ o.priceDelta >= 0 ? '+' : '' }}{{ o.priceDelta }})
          </label>
          <div><button @click="addToCart(it)">Add to cart</button> <button @click="addFav(it)">♥ Favorite</button></div>
        </div>
        <div class="row">
          <button @click="changePage(-1)" :disabled="shop.items.page <= 1">Prev</button>
          <span>Page {{ shop.items.page }} · {{ shop.items.total }} items</span>
          <button @click="changePage(1)" :disabled="shop.items.page * shop.items.pageSize >= shop.items.total">Next</button>
        </div>
        <h2>Reviews</h2>
        <div v-for="r in shop.reviews" :key="r.id" class="review"><b>{{ r.author }}</b> · {{ r.rating }}★<div class="rtext" v-html="r.text"></div></div>
        <div class="card">
          <h3>Leave a review</h3>
          <input v-model.number="rev.rating" type="number" min="1" max="5" />
          <textarea v-model="rev.text" placeholder="Your review (HTML allowed)…"></textarea>
          <button @click="addReview">Post review</button>
        </div>
      </section>

      <section v-else-if="path === '/cart'">
        <h1>Cart</h1>
        <div v-if="cart && cart.lines.length">
          <div v-for="(l, i) in cart.lines" :key="i" class="card">{{ l.item.name }} × {{ l.qty }} — ${{ l.lineTotal.toFixed(2) }}
            <span v-if="l.options.length" class="muted"> ({{ l.options.map(o => o.name).join(', ') }})</span></div>
          <h3>Total: ${{ cart.total.toFixed(2) }}</h3>
          <div v-if="authed" class="card">
            <h3>Checkout (mock card)</h3>
            <input v-model="co.number" placeholder="Card number" /><input v-model="co.exp" placeholder="MM/YY" /><input v-model="co.cvc" placeholder="CVC" />
            <input v-model="co.giftCardCode" placeholder="Gift card code (optional)" />
            <input v-model="coupons" placeholder="coupons, comma-separated (e.g. HALF,HALF)" />
            <button @click="doCheckout">Pay ${{ cart.total.toFixed(2) }}</button>
          </div>
          <p v-else class="muted">Please <a href="#/login">log in</a> to check out.</p>
        </div>
        <p v-else class="muted">Your cart is empty.</p>
      </section>

      <section v-else-if="path === '/orders'">
        <h1>Orders <span class="muted">(auto-refresh)</span></h1>
        <div v-for="o in orders" :key="o.id" class="card"><b>#{{ o.id }}</b> — ${{ o.total.toFixed(2) }} · <span :class="'st st-' + o.status">{{ o.status }}</span>
          <div class="muted">track: {{ o.trackingCode }} · card •••• {{ o.cardLast4 }}</div>
          <div class="row"><button @click="doRefund(o)">Refund</button><button @click="doCancel(o)">Cancel</button><button @click="loadNotes(o)">Notes</button><button @click="getInvoice(o)">Invoice</button></div>
          <div v-if="notesByOrder[o.id]"><div v-for="n in notesByOrder[o.id]" :key="n.id" class="muted">📝 {{ n.author }}: {{ n.text }}</div>
            <input v-model="noteText" placeholder="add a note" /><button @click="addNote(o)">Add note</button></div></div>
        <pre v-if="invoiceOut" class="card">{{ invoiceOut }}</pre>
        <p v-if="!orders.length" class="muted">No orders yet.</p>
      </section>

      <section v-else-if="path === '/help'">
        <h1>Help</h1>
        <div v-for="a in articles" :key="a.id" class="card"><h3>{{ a.question }}</h3><div class="rtext" v-html="a.answer"></div></div>
        <div class="card"><h3>Edit an article</h3>
          <input v-model="art.slug" placeholder="slug" /><input v-model="art.question" placeholder="question" />
          <textarea v-model="art.answer" placeholder="answer (HTML allowed)…"></textarea><button @click="saveArticle">Save article</button></div>
      </section>

      <section v-else-if="path === '/login' || path === '/register'">
        <h1>{{ path === '/login' ? 'Login' : 'Register' }}</h1>
        <div class="card">
          <input v-model="auth.username" placeholder="username" /><input v-model="auth.password" type="password" placeholder="password" />
          <button @click="doAuth(path === '/login' ? 'login' : 'register')">{{ path === '/login' ? 'Login' : 'Register' }}</button>
          <p class="muted"><a href="#/reset">Forgot password?</a></p>
        </div>
      </section>

      <section v-else-if="path === '/reset'">
        <h1>Reset password</h1>
        <div class="card">
          <input v-model="reset.username" placeholder="username" /><button @click="doReset('request')">Request token</button>
          <input v-model="reset.token" placeholder="reset token" /><input v-model="reset.newPassword" type="password" placeholder="new password" />
          <button @click="doReset('confirm')">Set new password</button>
        </div>
      </section>

      <section v-else-if="path === '/profile' && me">
        <h1>Profile</h1>
        <div class="card">
          <p>Role: {{ me.role }} · Credits: ${{ me.credits }} · Voucher: {{ me.voucher }}</p>
          <p class="muted">Invited by: {{ me.invitedBy || '—' }}</p>
          <input v-model="prof.username" placeholder="username" /><input v-model="prof.address" placeholder="delivery address" />
          <input v-model="prof.password" type="password" placeholder="new password (optional)" /><button @click="saveProfile">Save</button>
        </div>
        <div class="card"><h3>Gift cards</h3>
          <input v-model.number="gift.amount" type="number" placeholder="amount" /><button @click="buyGiftCard">Buy</button>
          <input v-model="gift.code" placeholder="gift card code" /><button @click="redeemGiftCard">Redeem</button></div>
        <div class="card"><h3>Transfer credits</h3>
          <input v-model="xfer.toUserId" placeholder="recipient user id" />
          <input v-model.number="xfer.amount" type="number" placeholder="amount (negative to steal)" /><button @click="doTransfer">Transfer</button></div>
        <div class="card"><h3>Change email · Become seller</h3>
          <input v-model="emailForm.email" placeholder="new email" />
          <input v-model="emailForm.userId" placeholder="target user id (optional — BOLA)" />
          <button @click="doChangeEmail">Change email</button><button @click="doBecomeSeller">Become seller</button></div>
        <div class="card"><h3>Favorites</h3>
          <div v-for="f in favorites" :key="f.id" class="muted">♥ {{ f.name }} — ${{ f.price.toFixed(2) }}</div>
          <p v-if="!favorites.length" class="muted">No favorites yet.</p></div>
      </section>

      <section v-else-if="path === '/tools'">
        <h1>Tools</h1>
        <div class="card"><h3>Login as (impersonate)</h3><input v-model="tools.loginAsId" placeholder="user id" /><button @click="doLoginAs">Login as</button></div>
        <div class="card"><h3>Register webhook (server fetches URL)</h3><input v-model="tools.webhookUrl" placeholder="http://…" /><button @click="doWebhook">Register</button></div>
        <div class="card"><h3>Upload asset</h3><input v-model="tools.upName" placeholder="filename" /><textarea v-model="tools.upContent" placeholder="file content"></textarea><button @click="doUpload">Upload</button></div>
        <div class="card"><h3>Seller: items &amp; shops</h3>
          <input v-model="tools.shopId" placeholder="shopId" /><input v-model="tools.itemName" placeholder="new item name" />
          <input v-model.number="tools.itemPrice" type="number" placeholder="price" /><button @click="doCreateItem">Create item</button><hr />
          <input v-model="tools.updItemId" placeholder="item id" /><input v-model="tools.updItemPrice" placeholder="new price (can be negative)" /><button @click="doUpdateItem">Update item</button><hr />
          <input v-model="tools.updShopId" placeholder="shop id" /><input v-model="tools.updShopName" placeholder="new shop name" /><button @click="doUpdateShop">Update shop</button></div>
      </section>

      <section v-else-if="path === '/invites'">
        <h1>Invitations</h1>
        <div class="card"><input v-model="inviteUser" placeholder="username to invite" /><button @click="doInvite">Invite</button></div>
        <div class="card"><p class="muted">Showing invitations for: {{ (me && me.id) }}</p>
          <div v-for="(iv, i) in invites" :key="i">→ {{ iv.invitee.username }} <span class="muted">({{ iv.invitee.id }})</span></div>
          <p v-if="!invites.length" class="muted">Nobody yet.</p></div>
      </section>

      <section v-else-if="path === '/admin'">
        <h1>Recent users</h1>
        <div v-for="u in recent" :key="u.id" class="card">{{ u.username }} · {{ u.role }} <span class="muted">{{ u.id }}</span></div>
      </section>

      <section v-else><p class="muted">Not found.</p></section>
    </div>
  </div>
</template>
