import fs from 'fs'

// This project has two "identical" READMEs, one at the package root
// and another in the perfect-freehand package folder. When we build
// the project, we want to replace the older README with the newer.

const pathA = 'README.md'
const pathB = './packages/perfect-freehand/README.md'

if (
  new Date(fs.statSync(pathA).mtime).getTime() >
  new Date(fs.statSync(pathB).mtime).getTime()
) {
  // A is newer; remove B and replace with A
  fs.rmSync(pathB)
  fs.copyFileSync(pathA, pathB)
} else {
  // B is newer; remove A and replace with B
  fs.rmSync(pathA)
  fs.copyFileSync(pathB, pathA)
}
