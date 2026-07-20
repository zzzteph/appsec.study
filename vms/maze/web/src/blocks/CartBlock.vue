<script setup>
import { ref, computed, onMounted } from 'vue'
import { state, apiGet, apiPost, apiPatch, findEndpoint, findAllEndpoints, fillPath } from '../lib/store'
import { photo, avatar } from '../lib/img'
const props = defineProps({ view: Object, widget: { type:String, default:'cards' } })
const price = ref(19.99); const qty = ref(1); const total = ref(null)
const ep = computed(()=> findEndpoint(props.view,'checkout'))
async function checkout(){ if(!ep.value) return; const r = await apiPost(ep.value.p,{items:[{price:Number(price.value),qty:Number(qty.value)}]}); total.value=r.data }

</script>
<template>
<section class="blk card pad" v-if="ep">
  <div class="blk-h">Cart</div>
  <div class="row"><input class="field" v-model="price" /><input class="field" v-model="qty" style="width:90px" /><button class="btn" @click="checkout">Checkout</button></div>
  <pre class="out" v-if="total">{{ JSON.stringify(total,null,2) }}</pre>
</section>
</template>
