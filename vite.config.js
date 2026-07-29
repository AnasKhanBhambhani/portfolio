import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const r = (p) => fileURLToPath(new URL(p, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      // Ported Site Lens feature imports the host app via `@/...`; point it at
      // the local stub tree that reimplements those app modules.
      '@': r('./src/site-lens/_app'),
      // Site Lens components are MobX observers / use FontAwesome Pro icons —
      // neither exists here, so alias them to lightweight local stubs.
      'mobx-react-lite': r('./src/site-lens/_app/vendor/mobx.js'),
      'mobx-react': r('./src/site-lens/_app/vendor/mobx.js'),
      '@fortawesome/react-fontawesome': r('./src/site-lens/_app/vendor/fa-icon.jsx'),
      '@fortawesome/pro-regular-svg-icons': r('./src/site-lens/_app/vendor/fa-defs.js'),
      '@fortawesome/pro-solid-svg-icons': r('./src/site-lens/_app/vendor/fa-defs.js'),
    },
  },
  // Pre-bundle the heavy, lazily-imported graph/3D deps up front. Otherwise
  // Vite discovers them on first use, re-optimizes mid-session, and the
  // in-flight dynamic import 404s ("Failed to fetch dynamically imported
  // module"). Listing them here makes dev startup deterministic.
  optimizeDeps: {
    include: [
      'react-force-graph-2d',
      'react-force-graph-3d',
      'react-d3-tree',
      'three',
      'three-spritetext',
      'clsx',
      'tailwind-merge',
      'prism-react-renderer',
    ],
  },
})
