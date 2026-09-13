import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // Fixed the package name here

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // This handles your backend communication to localhost:5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})