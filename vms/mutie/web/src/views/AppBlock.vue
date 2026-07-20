<script setup>
import { computed } from 'vue'
import { pickTemplate, pickFamily, pickSkin, pickLayout, pickWidget } from '../lib/factory'

const props = defineProps({ view: Object })
const comp = computed(() => pickTemplate(props.view))
const family = computed(() => pickFamily(props.view))
const skin = computed(() => pickSkin(props.view, family.value))
const layout = computed(() => pickLayout(props.view, family.value))
const widget = computed(() => pickWidget(props.view, family.value))
</script>
<template>
  <section :key="view.id" :class="'skin-' + skin" class="block">
    <div class="section-title">
      <span class="kicker">{{ family.name }}</span>
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
.block { border-radius: 12px; }
.kicker { font-size: .7rem; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); background: var(--accent-soft, #fce4ec); padding: .12rem .55rem; border-radius: 999px; font-weight: 600; }
.chip.admin { background: #ffe0b2; color: #e65100; }
</style>
