<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { pickTemplate, pickLayout, pickWidget } from '../lib/factory'

const props = defineProps({ view: Object })
const comp = computed(() => pickTemplate(props.view))
const layout = computed(() => pickLayout(props.view))
const widget = computed(() => pickWidget(props.view))
</script>
<template>
  <section :key="view.id">
    <div class="section-title">
      <span>{{ view.title }}</span>
      <span class="chip">{{ view.kind }}</span>
      <span class="chip cat">layout {{ layout }}</span>
      <span class="chip cat">{{ widget }}</span>
      <span v-if="view.admin" class="chip admin">admin</span>
    </div>
    <component :is="comp" :view="view" :layout="layout" :widget="widget" />
  </section>
</template>
<style scoped>
.chip.admin { background: #ffe0b2; color: #e65100; }
</style>
