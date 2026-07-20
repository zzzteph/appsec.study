<script setup>
const props = defineProps({ view: Object })

</script>
<template>
<footer class="blk foot"><span>© maze · {{ view.app }}</span><span class="muted">/{{ view.slug }}</span></footer>
</template>
<style scoped>.foot{display:flex;justify-content:space-between;padding:1rem 1.2rem;color:var(--muted);border-top:1px solid var(--line);font-size:.85rem}</style>
