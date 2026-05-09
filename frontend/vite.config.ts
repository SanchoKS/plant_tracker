import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/catalog': 'http://localhost:8000',
      '/my-plants': 'http://localhost:8000',
      '/care-log': 'http://localhost:8000',
      '/diagnostics': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
    },
  },
})
