<script setup>
import { computed } from 'vue'
import { BLOCKS } from '../blocks'
import { pageBlocks } from '../lib/pages'
import { skinVars } from '../skins'
import { pickSkin, pickWidget, pickLayoutComp } from '../lib/factory'
const props = defineProps({ view: Object })
const skin = computed(() => pickSkin(props.view))
const widget = computed(() => pickWidget(props.view))
const Layout = computed(() => pickLayoutComp(props.view))
const comps = computed(() => pageBlocks(props.view).map(n => ({ n, C: BLOCKS[n] })).filter(x => x.C))
</script>
<template>
  <div class="page" :style="skinVars(skin)" :class="'skin-' + skin">
    <div class="page-meta"><span class="chip">{{ view.kind }}</span><span class="chip cat">{{ skin }}</span><span class="chip cat">{{ widget }}</span><span v-if="view.admin" class="chip admin">admin</span></div>
    <component :is="Layout">
      <component v-for="x in comps" :is="x.C" :key="x.n" :view="view" :widget="widget" />
    </component>
  </div>
</template>
<style scoped>
.page-meta{display:flex;gap:.4rem;margin-bottom:.8rem;flex-wrap:wrap}
.chip.admin{background:#ffe0b2;color:#e65100}
</style>
