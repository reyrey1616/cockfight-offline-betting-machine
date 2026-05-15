import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tailwind v4 ships a first-party Vite plugin. NO `tailwind.config.js`,
// NO postcss.config.js, NO `@tailwind base/components/utilities` — you
// just import the engine in your CSS and it picks up class usage by
// scanning your source files.
//
// The `@` alias mirrors the shadcn/ui CLI convention and lets us write
// `import { Button } from '@/components/ui/button'` instead of long
// relative paths. shadcn writes its components under `src/components/ui`
// and assumes this alias exists.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Bind 0.0.0.0 so phones / other PCs on the LAN can open http://<this-machine-ip>:5173
  server: {
    host: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
