import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build for Home Assistant panel: assets served at /local/led-panel-editor/
export default defineConfig({
  plugins: [react()],
  base: '/local/led-panel-editor/',
})
