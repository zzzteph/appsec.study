import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({ plugins: [vue()], build: { outDir: 'dist' }, server: { proxy: { '/service': 'http://localhost:80', '/api': 'http://localhost:80' } } })
