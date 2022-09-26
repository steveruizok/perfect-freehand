/* eslint-disable */
const fs = require('fs')
const esbuild = require('esbuild')
const { gzip } = require('zlib')

const name = process.env.npm_package_name || ''

async function main() {
  await esbuild.build({
    entryPoints: ['./src/index.ts'],
    outdir: 'dist/cjs',
    minify: true,
    bundle: true,
    format: 'cjs',
    target: 'es6',
    tsconfig: './tsconfig.build.json',
  })

  const esmResult = await esbuild.build({
    entryPoints: ['./src/index.ts'],
    outdir: 'dist/esm',
    minify: true,
    bundle: true,
    format: 'esm',
    target: 'es6',
    tsconfig: './tsconfig.build.json',
    metafile: true,
    outExtension: { '.js': '.mjs' },
  })

  let esmSize = 0
  Object.values(esmResult.metafile.outputs).forEach((output) => {
    esmSize += output.bytes
  })

  fs.readFile('./dist/esm/index.mjs', (_err, data) => {
    gzip(data, (_err, result) => {
      console.log(
        `✔ ${name}: Built package. ${(esmSize / 1000).toFixed(2)}kb (${(
          result.length / 1000
        ).toFixed(2)}kb minified)`
      )
    })
  })
}

main().catch((e) => {
  console.log(`× ${name}: Build failed due to an error.`)
  console.log(e)
})
