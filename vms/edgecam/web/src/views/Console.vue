<script setup>
import { ref, onMounted } from 'vue'
import { get } from '../api'
const cameras = ref([]); const recordings = ref([])
onMounted(async () => { cameras.value = await get('/cameras'); recordings.value = await get('/recordings') })
</script>
<template>
  <div class="content">
    <h1>Live View</h1>
    <div class="grid g2" style="margin-bottom:22px">
      <div v-for="c in cameras" :key="c.id" class="cam">
        <span class="rec" v-if="c.status === 'online'">● REC</span>
        <span v-if="c.status !== 'online'" class="off">NO SIGNAL</span>
        <span v-else class="off" style="opacity:.4">CH{{ c.channel }} · 1080p</span>
        <span class="lbl">{{ c.name }}</span>
      </div>
    </div>
    <div class="card">
      <h3>Recordings</h3>
      <table><thead><tr><th>ID</th><th>Camera</th><th>Started</th><th>Duration</th><th>Size</th></tr></thead>
        <tbody><tr v-for="r in recordings" :key="r.id"><td>{{ r.id }}</td><td>CH{{ r.camera_id }}</td><td class="mono">{{ r.started }}</td><td>{{ Math.round(r.duration/60) }} min</td><td>{{ r.size_mb }} MB</td></tr></tbody></table>
    </div>
  </div>
</template>
