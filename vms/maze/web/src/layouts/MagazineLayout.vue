<script setup></script>
<template>
  <div class="lay-mag"><slot /></div>
</template>
<style scoped>.lay-mag{column-count:2;column-gap:1.2rem}.lay-mag>*{break-inside:avoid;margin-bottom:1.2rem}@media(max-width:820px){.lay-mag{column-count:1}}</style>
