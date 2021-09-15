/* eslint-disable */

const esbuild = require('esbuild')

const name = process.env.npm_package_name || ''

async function main() {
  esbuild.build({
    entryPoints: ['./src/index.ts'],
    outdir: 'dist/esm',
    minify: false,
    bundle: true,
    format: 'esm',
    target: 'esnext',
    tsconfig: './tsconfig.json',
    watch: {
      onRebuild(error) {
        if (error) {
          console.log(`× ${name}: An error in prevented the rebuild.`)
          return
        }
        console.log(`✔ ${name}: Rebuilt perfect-freehand.`)
      },
    },
  })
}

main()
