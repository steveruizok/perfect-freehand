import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setupTests.ts'],
    include: [
      'packages/**/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    alias: {
      'perfect-freehand': './packages/perfect-freehand/src',
    },
    benchmark: {
      include: ['packages/**/src/**/*.bench.ts'],
    },
  },
})
