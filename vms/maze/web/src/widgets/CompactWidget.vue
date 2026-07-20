<script setup>
defineProps({ items: { type: Array, default: () => [] } })
</script>
<template>
  <div class="coll compact">
    <div v-for="(it,i) in items" :key="i"><slot name="item" :item="it" :i="i">{{ it }}</slot></div>
  </div>
</template>
