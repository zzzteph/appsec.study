<template>
  <nav class="navbar is-white has-shadow">
    <div class="container">
      <div class="navbar-brand">
        <a class="navbar-item has-text-weight-bold" href="/">
          <span class="icon has-text-info"><i class="fas fa-cloud"></i></span>&nbsp;Boxcutter Store
        </a>
      </div>
      <div class="navbar-menu"><div class="navbar-end">
        <a class="navbar-item" href="/">Shop</a>
        <a v-if="token" class="navbar-item" @click="logout">Sign out</a>
      </div></div>
    </div>
  </nav>

  <section class="section"><div class="container">

    <!-- Sign in -->
    <div v-if="!token" class="box" style="max-width:420px">
      <h1 class="title is-4">Sign in to your account</h1>
      <input class="input mb-2" v-model="form.username" placeholder="Username">
      <input class="input mb-2" type="password" v-model="form.password" placeholder="Password">
      <button class="button is-info" @click="login">Sign in</button>
      <p class="help has-text-grey">Demo account: <code>user</code> / <code>user</code></p>
      <p class="help is-danger" v-if="error">{{ error }}</p>
    </div>

    <!-- Authenticated account area -->
    <div v-else>
      <h1 class="title">My account</h1>
      <!-- in-app notice banner, updated by host-page widgets via postMessage -->
      <div v-if="notice" class="notification is-info" v-html="notice"></div>
      <div class="tabs"><ul>
        <li :class="{ 'is-active': tab === 'profile' }"><a @click="tab = 'profile'">Profile</a></li>
        <li :class="{ 'is-active': tab === 'orders' }"><a @click="tab = 'orders'">Orders</a></li>
        <li :class="{ 'is-active': tab === 'settings' }"><a @click="tab = 'settings'">Settings</a></li>
      </ul></div>

      <div v-if="tab === 'profile'" class="box">
        <p class="title is-5">{{ profile.full_name }} <span class="tag is-info">{{ profile.role }}</span></p>
        <p class="subtitle is-6">{{ profile.email }}</p>
        <!-- bio is rendered as raw HTML -->
        <div class="content" v-html="profile.bio"></div>
      </div>

      <div v-if="tab === 'orders'" class="box">
        <p class="mb-2">Look up one of your orders by number.</p>
        <div class="field has-addons">
          <div class="control is-expanded">
            <input class="input" v-model="orderId" placeholder="Order # (e.g. 1001)">
          </div>
          <div class="control"><button class="button is-info" @click="lookupOrder">Look up</button></div>
        </div>
        <table class="table is-fullwidth" v-if="orders.length">
          <thead><tr><th>#</th><th>Item</th><th>Total</th><th>Ship to</th><th>Card</th></tr></thead>
          <tbody>
            <tr v-for="o in orders" :key="o.id">
              <td>{{ o.id }}</td><td>{{ o.item }}</td><td>${{ o.total }}</td>
              <td>{{ o.address }}</td><td>****{{ o.card_last4 }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="tab === 'settings'" class="box">
        <div class="field"><label class="label">Full name</label>
          <input class="input" v-model="profile.full_name"></div>
        <div class="field"><label class="label">Email</label>
          <input class="input" v-model="profile.email"></div>
        <div class="field"><label class="label">Bio <span class="has-text-grey">(HTML allowed)</span></label>
          <textarea class="textarea" v-model="profile.bio"></textarea></div>
        <button class="button is-info" @click="saveProfile">Save changes</button>
        <p class="help is-success" v-if="saved">Saved.</p>
      </div>
    </div>

  </div></section>
</template>

<script>
// API surface used by the account app. A couple are internal services that are
// not in the public OpenAPI document and are only referenced from this bundle.
const API = '/api'
const ROUTES = {
  login: API + '/login',
  me: API + '/me',
  profile: API + '/profile',
  orders: API + '/orders/',
  recommendations: API + '/v1/users',     // internal recommendations service
  internalDebug: API + '/internal/debug',  // internal build/debug endpoint
}

export default {
  data() {
    return {
      token: localStorage.getItem('boxcutter_token') || '',
      form: { username: 'user', password: 'user' },
      error: '',
      tab: 'profile',
      saved: false,
      profile: { full_name: '', email: '', role: '', bio: '' },
      orderId: '1001',
      orders: [],
      notice: '',
    }
  },
  mounted() {
    if (this.token) this.loadProfile()
    // VULN[xss-postmessage]: a window 'message' handler with NO origin check writes
    // attacker-controlled data into a v-html sink, so any page that frames or opens
    // this app can postMessage({notice:'<img src=x onerror=alert(document.domain)>'})
    // and run script in this origin (DOM XSS via postMessage).
    window.addEventListener('message', (e) => {
      const m = e.data || {}
      if (m.notice !== undefined) this.notice = m.notice
    })
  },
  methods: {
    authHeaders() {
      return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + this.token }
    },
    login() {
      this.error = ''
      fetch(ROUTES.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.form),
      }).then(r => r.json()).then(d => {
        if (d.token) {
          this.token = d.token
          localStorage.setItem('boxcutter_token', d.token)
          this.loadProfile()
        } else {
          this.error = d.error || 'Login failed'
        }
      }).catch(() => { this.error = 'Network error' })
    },
    loadProfile() {
      fetch(ROUTES.profile, { headers: this.authHeaders() })
        .then(r => r.json()).then(d => { this.profile = d })
    },
    saveProfile() {
      // Sends the whole profile object back (bio is stored and later re-rendered).
      fetch(ROUTES.profile, {
        method: 'POST', headers: this.authHeaders(), body: JSON.stringify(this.profile),
      }).then(r => r.json()).then(d => { this.profile = d; this.saved = true })
    },
    lookupOrder() {
      fetch(ROUTES.orders + this.orderId, { headers: this.authHeaders() })
        .then(r => r.json()).then(d => { this.orders = d.orders || [] })
    },
    logout() {
      localStorage.removeItem('boxcutter_token')
      this.token = ''
    },
  },
}
</script>
