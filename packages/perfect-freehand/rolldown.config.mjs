/* global console */
import { defineConfig } from 'rolldown'
import { readFileSync } from 'fs'
import { gzipSync } from 'zlib'

// Get package name for logging
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const name = pkg.name

/**
 * Custom plugin to report bundle sizes after build
 */
function reportSizePlugin() {
  return {
    name: 'report-size',
    writeBundle(options, bundle) {
      let totalSize = 0
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk') {
          totalSize += chunk.code.length
        }
      }

      // Find the main chunk for gzip calculation
      const mainChunk = Object.values(bundle).find((b) => b.type === 'chunk')
      if (mainChunk) {
        const gzipped = gzipSync(mainChunk.code)
        console.log(
          `\u2714 ${name}: Built package. ${(totalSize / 1000).toFixed(2)}kb (${(gzipped.length / 1000).toFixed(2)}kb gzipped)`
        )
      }
    },
  }
}

export default defineConfig([
  // CommonJS build
  {
    input: './src/index.ts',
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      entryFileNames: '[name].js',
      sourcemap: true,
      exports: 'named',
      minify: true,
    },
    resolve: {
      tsconfigFilename: './tsconfig.build.json',
    },
  },
  // ESM build
  {
    input: './src/index.ts',
    output: {
      dir: 'dist/esm',
      format: 'esm',
      entryFileNames: '[name].mjs',
      sourcemap: true,
      exports: 'named',
      minify: true,
    },
    resolve: {
      tsconfigFilename: './tsconfig.build.json',
    },
    plugins: [reportSizePlugin()],
  },
])
