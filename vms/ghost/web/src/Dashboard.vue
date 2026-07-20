<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { get, post, patch, del } from './api.js'

const me = ref(JSON.parse(localStorage.getItem('g_user') || 'null'))
const tab = ref('orders')
const orders = ref([])
const inventory = ref([])
const invoices = ref([])
const payments = ref({ count: 0, total: 0 })
const newInv = reactive({ name: '', qty: 10, price: 1 })
const msg = ref('')
function flash(t) { msg.value = t; setTimeout(() => { if (msg.value === t) msg.value = '' }, 3000) }

async function loadOrders() { orders.value = await get('/orders') }
async function loadInventory() { inventory.value = await get('/inventory') }
async function loadInvoices() { invoices.value = await get('/invoices') }
async function loadPayments() { payments.value = await get('/payments') }
async function act(o, a) { try { await post('/orders/' + o.id + '/' + a); await loadOrders(); await loadPayments() } catch (e) { flash(e.message) } }
async function addInv() { try { await post('/inventory', { ...newInv }); newInv.name = ''; await loadInventory() } catch (e) { flash(e.message) } }
async function saveInv(it) { try { await patch('/inventory/' + it.id, { name: it.name, qty: it.qty, price: it.price }); flash('Saved') } catch (e) { flash(e.message) } }
async function delInv(it) { try { await del('/inventory/' + it.id); await loadInventory() } catch (e) { flash(e.message) } }

let poll = null
onMounted(async () => {
  try { me.value = await get('/me') } catch (e) { /* keep cached */ }
  await Promise.all([loadOrders(), loadInventory(), loadInvoices(), loadPayments()])
  poll = setInterval(() => { loadOrders(); loadPayments() }, 8000)
})
onUnmounted(() => { if (poll) clearInterval(poll) })
</script>

<template>
  <div class="dash">
    <div class="shophead">
      <h2>{{ me && me.shopName }}</h2>
      <div class="tabs">
        <button :class="{ on: tab === 'orders' }" @click="tab = 'orders'">Orders</button>
        <button :class="{ on: tab === 'inventory' }" @click="tab = 'inventory'">Inventory</button>
        <button :class="{ on: tab === 'invoices' }" @click="tab = 'invoices'">Invoices</button>
        <button :class="{ on: tab === 'payments' }" @click="tab = 'payments'">Payments</button>
      </div>
    </div>
    <p v-if="msg" class="flash">{{ msg }}</p>

    <div v-if="tab === 'orders'">
      <table>
        <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Total</th><th>Customer</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id">
            <td>{{ o.id }}</td><td>{{ o.itemName }}</td><td>{{ o.qty }}</td><td>${{ o.total.toFixed(2) }}</td><td>{{ o.customer }}</td>
            <td><span :class="'st st-' + o.status">{{ o.status }}</span></td>
            <td>
              <template v-if="o.status === 'pending'"><button @click="act(o, 'approve')">Approve</button><button @click="act(o, 'decline')">Decline</button></template>
              <button v-else-if="o.status === 'approved'" @click="act(o, 'deliver')">Deliver</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!orders.length" class="muted">No orders yet.</p>
    </div>

    <div v-else-if="tab === 'inventory'">
      <div class="card add">
        <input v-model="newInv.name" placeholder="item name" />
        <input v-model.number="newInv.qty" type="number" placeholder="qty" />
        <input v-model.number="newInv.price" type="number" step="0.01" placeholder="price" />
        <button @click="addInv">Add item</button>
      </div>
      <table>
        <thead><tr><th>#</th><th>Name</th><th>Qty</th><th>Price</th><th></th></tr></thead>
        <tbody>
          <tr v-for="it in inventory" :key="it.id">
            <td>{{ it.id }}</td><td><input v-model="it.name" /></td><td><input v-model.number="it.qty" type="number" /></td><td><input v-model.number="it.price" type="number" step="0.01" /></td>
            <td><button @click="saveInv(it)">Save</button><button @click="delInv(it)">Delete</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="tab === 'invoices'">
      <table>
        <thead><tr><th>#</th><th>Customer</th><th>Item</th><th>Total</th><th>Status</th></tr></thead>
        <tbody><tr v-for="iv in invoices" :key="iv.id"><td>{{ iv.id }}</td><td>{{ iv.customer }}</td><td>{{ iv.item }}</td><td>${{ iv.total.toFixed(2) }}</td><td>{{ iv.status }}</td></tr></tbody>
      </table>
      <p v-if="!invoices.length" class="muted">No invoices.</p>
    </div>

    <div v-else-if="tab === 'payments'">
      <div class="card big"><h1>${{ payments.total.toFixed(2) }}</h1><p class="muted">{{ payments.count }} paid orders</p></div>
    </div>
  </div>
</template>
