import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: { outDir: 'dist', chunkSizeWarningLimit: 900 },
  server: { proxy: { '/api': 'http://localhost:80', '/apps': 'http://localhost:80', '/.well-known': 'http://localhost:80' } },
})
