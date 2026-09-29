import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// `npm run dev:demo` (vite --mode demo) swaps the data layer and auth hook for in-memory demo
// versions (src/dev/*) so every page can be previewed without logging in.
// Dev server only — production builds never include the demo files.
const demoMode = (): Plugin => {
  const swaps: Record<string, string> = {
    [path.resolve(__dirname, 'src/services/db.ts')]: path.resolve(__dirname, 'src/dev/demoDb.ts'),
    [path.resolve(__dirname, 'src/hooks/useAuth.ts')]: path.resolve(__dirname, 'src/dev/demoAuth.ts'),
  }
  return {
    name: 'bill-counter-demo-mode',
    apply: 'serve',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || !source.startsWith('.')) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      return resolved && swaps[path.normalize(resolved.id)] ? swaps[path.normalize(resolved.id)] : null
    },
  }
}

export default defineConfig(({ mode }) => ({
  // Repo name — the site is served from https://tajparaankit.github.io/Bill-Counter/
  base: '/Bill-Counter/',
  plugins: [react(), ...(mode === 'demo' ? [demoMode()] : [])],
  server: {
    port: 5173,
    open: true
  }
}))
