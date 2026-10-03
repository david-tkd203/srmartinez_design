import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        upload: resolve(import.meta.dirname, 'design-upload.html'),
        dashboard: resolve(import.meta.dirname, 'design-dashboard.html'),
        adminStats: resolve(import.meta.dirname, 'admin-stats.html'),
        login: resolve(import.meta.dirname, 'login.html')
      }
    }
  }
})

