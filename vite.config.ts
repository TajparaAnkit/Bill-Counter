import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Repo name — the site is served from https://tajparaankit.github.io/Bill-Counter/
  base: '/Bill-Counter/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})
