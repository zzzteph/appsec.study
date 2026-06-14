import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Alias to the FULL build so Vue's runtime template compiler is shipped. This
// is what makes runtime-compiled templates (and therefore the CSTI demo) work.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { vue: 'vue/dist/vue.esm-bundler.js' },
  },
  define: {
    __VUE_OPTIONS_API__: 'true',
    __VUE_PROD_DEVTOOLS__: 'false',
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  },
  build: { outDir: 'dist' },
})
