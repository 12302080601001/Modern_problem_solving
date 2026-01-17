import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // <--- THIS IS THE MAGIC KEY
    port: 5173,  // Ensures it stays on 5173
  }
})