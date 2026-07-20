<script setup></script>
<template>
  <div class="lay-side"><slot /></div>
</template>
<style scoped>.lay-side{display:grid;grid-template-columns:2fr 1fr;gap:1.2rem}@media(max-width:820px){.lay-side{grid-template-columns:1fr}}</style>
