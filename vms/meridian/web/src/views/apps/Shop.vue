<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../../api'
import { appIcon, logo } from '../../assets/art'

const products = ref([])
onMounted(async () => { try { products.value = await get('/apps/shop/products') } catch {} })
function signin() { window.location.href = '/authorize?client_id=shop-app&redirect_uri=/apps/shop&scope=' + encodeURIComponent('openid profile email') }
</script>

<template>
  <div class="content">
    <nav class="row" style="margin-bottom:24px"><img class="appicon" :src="appIcon('shop')" /><h2 style="margin:0">Meridian Shop</h2>
      <span class="grow"></span><button class="btn sm" @click="signin">Sign in with Meridian</button><a href="/" style="margin-left:12px">← Meridian ID</a></nav>
    <div class="grid g3">
      <div v-for="p in products" :key="p.id" class="card">
        <img class="appicon" :src="appIcon('shop')" />
        <h3 style="margin:10px 0 4px">{{ p.name }}</h3>
        <div class="muted">${{ p.price }}</div>
        <button class="btn primary sm" style="margin-top:12px">Add to cart</button>
      </div>
    </div>
  </div>
</template>
