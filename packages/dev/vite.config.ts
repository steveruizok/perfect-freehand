import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src',
  server: {
    port: 5420,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    target: ['chrome58', 'firefox57', 'safari11', 'edge18'],
  },
  resolve: {
    alias: {
      // Support baseUrl: "./src" from tsconfig - resolve bare imports
      components: path.resolve(__dirname, 'src/components'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      state: path.resolve(__dirname, 'src/state'),
    },
  },
  // CSS modules are supported out of the box in Vite
  // Files ending with .module.css are automatically treated as CSS modules
})
