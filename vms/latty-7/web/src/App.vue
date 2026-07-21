<script>
import { get, post, put, del } from './api.js'

export default {
  name: 'App',
  data() {
    return {
      loggedIn: !!localStorage.getItem('mf_tok'),
      lu: 'test1', lp: 'test1', loginErr: '',
      me: null, restaurant: null,
      view: 'menus',
      menus: [], currentMenu: null, items: [],
      newMenu: '', newItem: { name: '', price: 0, section: 'Mains' },
      editing: null, err: '', msg: '',
    }
  },
  computed: {
    rid() { return this.me ? this.me.restaurantId : null },
  },
  methods: {
    flash(t) { this.msg = t; setTimeout(() => { if (this.msg === t) this.msg = '' }, 2500) },
    async login() {
      this.loginErr = ''
      try {
        const r = await post('/login', { username: this.lu, password: this.lp })
        localStorage.setItem('mf_tok', r.token)
        this.loggedIn = true
        await this.boot()
      } catch (e) { this.loginErr = e.message }
    },
    logout() { localStorage.removeItem('mf_tok'); this.loggedIn = false; this.me = null },
    async boot() {
      this.me = await get('/me')
      this.restaurant = await get('/restaurant/' + this.rid)
      await this.loadMenus()
    },
    async loadMenus() { this.menus = await get('/restaurant/' + this.rid + '/menu'); this.view = 'menus'; this.currentMenu = null },
    async openMenu(m) { this.currentMenu = m; this.items = await get('/restaurant/' + this.rid + '/menu/' + m.id + '/items'); this.view = 'items' },
    async addMenu() { if (!this.newMenu.trim()) return; try { await post('/restaurant/' + this.rid + '/menu', { name: this.newMenu }); this.newMenu = ''; await this.loadMenus() } catch (e) { this.err = e.message } },
    async removeMenu(m) { try { await del('/restaurant/' + this.rid + '/menu/' + m.id); await this.loadMenus() } catch (e) { this.err = e.message } },
    async addItem() { const b = this.newItem; if (!b.name.trim()) return; try { await post('/restaurant/' + this.rid + '/menu/' + this.currentMenu.id + '/items', { name: b.name, price: Number(b.price) || 0, section: b.section }); this.newItem = { name: '', price: 0, section: 'Mains' }; await this.openMenu(this.currentMenu) } catch (e) { this.err = e.message } },
    async removeItem(it) { try { await del('/restaurant/' + this.rid + '/menu/' + this.currentMenu.id + '/items/' + it.id); await this.openMenu(this.currentMenu) } catch (e) { this.err = e.message } },
    edit(it) { this.editing = { ...it, allergens: (it.allergens || []).join(', ') } },
    async saveEdit() {
      const e = this.editing
      try {
        await put('/restaurant/' + this.rid + '/menu/' + this.currentMenu.id + '/items/' + e.id, {
          name: e.name, price: Number(e.price) || 0, section: e.section, description: e.description,
          allergens: String(e.allergens).split(',').map(s => s.trim()).filter(Boolean), available: !!e.available,
        })
        this.editing = null; this.flash('Saved'); await this.openMenu(this.currentMenu)
      } catch (x) { this.err = x.message }
    },
  },
  async mounted() { if (this.loggedIn) { try { await this.boot() } catch { this.logout() } } },
}
</script>

<template>
  <!-- LOGIN -->
  <div v-if="!loggedIn" class="login-wrap">
    <div class="card login">
      <div class="brand"><span class="logo">🍽️</span> MenuForge</div>
      <p class="muted">Partner menu editor. Sign in to manage your menus.</p>
      <label class="lbl">Username</label>
      <input class="field" v-model="lu" />
      <label class="lbl">Password</label>
      <input class="field" v-model="lp" type="password" @keyup.enter="login" />
      <button class="btn" @click="login">Sign in</button>
      <p v-if="loginErr" class="err">{{ loginErr }}</p>
      <p class="demo">Accounts: <code>test1 / test1</code> · <code>test2 / test2</code></p>
    </div>
  </div>

  <!-- APP -->
  <div v-else class="shell">
    <header class="topbar">
      <span class="brand"><span class="logo">🍽️</span> MenuForge</span>
      <nav class="tabs"><a class="on">Menu</a></nav>
      <span class="spacer"></span>
      <span class="who" v-if="restaurant">{{ restaurant.name }} · {{ me.username }}</span>
      <button class="btn flat" @click="logout">Sign out</button>
    </header>

    <main>
      <div class="crumbs">
        <a @click="loadMenus">Menus</a>
        <template v-if="view === 'items' && currentMenu"><span>›</span><span class="here">{{ currentMenu.name }}</span></template>
      </div>
      <p v-if="msg" class="ok">{{ msg }}</p>
      <p v-if="err" class="err">{{ err }}</p>

      <!-- MENUS -->
      <section v-if="view === 'menus'">
        <h2>Menus</h2>
        <div class="grid">
          <div v-for="m in menus" :key="m.id" class="card menu">
            <div class="menu-head"><b>{{ m.name }}</b><span class="chip" :class="{ off: !m.active }">{{ m.active ? 'active' : 'hidden' }}</span></div>
            <p class="muted">{{ m.itemCount }} item(s)</p>
            <div class="row"><button class="btn sm" @click="openMenu(m)">Open</button><button class="btn sm ghost" @click="removeMenu(m)">Delete</button></div>
          </div>
        </div>
        <div class="card add">
          <input class="field" v-model="newMenu" placeholder="New menu name" @keyup.enter="addMenu" />
          <button class="btn" @click="addMenu">Add menu</button>
        </div>
      </section>

      <!-- ITEMS -->
      <section v-else-if="view === 'items' && currentMenu">
        <h2>{{ currentMenu.name }} — items</h2>
        <table class="data">
          <thead><tr><th>Name</th><th>Section</th><th>Price</th><th>Allergens</th><th>Available</th><th></th></tr></thead>
          <tbody>
            <tr v-for="it in items" :key="it.id">
              <td>{{ it.name }}</td><td>{{ it.section }}</td><td>£{{ Number(it.price).toFixed(2) }}</td>
              <td class="muted">{{ (it.allergens || []).join(', ') || '—' }}</td>
              <td>{{ it.available ? 'yes' : 'no' }}</td>
              <td class="right"><button class="btn sm" @click="edit(it)">Edit</button><button class="btn sm ghost" @click="removeItem(it)">Delete</button></td>
            </tr>
          </tbody>
        </table>
        <div class="card add">
          <input class="field" v-model="newItem.name" placeholder="Item name" />
          <input class="field small" v-model="newItem.section" placeholder="Section" />
          <input class="field small" v-model.number="newItem.price" type="number" step="0.01" placeholder="Price" />
          <button class="btn" @click="addItem">Add item</button>
        </div>
      </section>
    </main>

    <!-- EDIT MODAL -->
    <div v-if="editing" class="scrim" @click="editing = null"></div>
    <div v-if="editing" class="card modal">
      <h3>Edit item</h3>
      <label class="lbl">Name</label><input class="field" v-model="editing.name" />
      <div class="row2">
        <div><label class="lbl">Section</label><input class="field" v-model="editing.section" /></div>
        <div><label class="lbl">Price (£)</label><input class="field" v-model.number="editing.price" type="number" step="0.01" /></div>
      </div>
      <label class="lbl">Description</label><textarea class="field" v-model="editing.description" rows="2"></textarea>
      <label class="lbl">Allergens (comma-separated)</label><input class="field" v-model="editing.allergens" />
      <label class="chk"><input type="checkbox" v-model="editing.available" /> Available</label>
      <div class="row"><button class="btn" @click="saveEdit">Save</button><button class="btn ghost" @click="editing = null">Cancel</button></div>
    </div>
  </div>
</template>
