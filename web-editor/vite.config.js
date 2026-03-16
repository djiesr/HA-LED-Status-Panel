import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// For HA panel build use: npm run build:ha (uses vite.config.ha.js)
export default defineConfig({
  plugins: [react()],
})
