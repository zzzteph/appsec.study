<script setup></script>
<template>
  <div class="lay-split"><slot /></div>
</template>
<style scoped>.lay-split{display:grid;grid-template-columns:1fr 1fr;gap:1.2rem}@media(max-width:820px){.lay-split{grid-template-columns:1fr}}</style>
