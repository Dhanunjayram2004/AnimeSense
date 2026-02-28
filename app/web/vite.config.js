import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // Required for Capacitor (file://) so assets resolve correctly
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    watch: {
      ignored: ['**/android/**', '**/dist/**'],
    },
  },
})