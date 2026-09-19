import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  define: {
    global: 'globalThis'
  },
  plugins: [
    react(),
    tailwindcss(),
    // HTTPS is required for getUserMedia (camera/mic) on non-localhost origins.
    // basicSsl generates a self-signed certificate for the dev server.
    basicSsl(),
  ],
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  }
})

