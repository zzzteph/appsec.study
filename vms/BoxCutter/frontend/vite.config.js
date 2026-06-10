import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Built assets are served by Flask from /static/spa/.
export default defineConfig({
  plugins: [vue()],
  base: '/static/spa/',
  build: { outDir: 'dist', emptyOutDir: true }
})
