import fs from 'fs'

// This project has two "identical" READMEs, one at the package root
// and another in the perfect-freehand package folder. When we build
// the project, we want to replace the older README with the newer.

const files = [
  'README.md',
  'assets/process.gif',
  'assets/icons.png',
  'assets/perfect-freehand-card.png',
  'assets/perfect-freehand-logo.svg',
]

for (const file of files) {
  const pathA = file
  const pathB = `./packages/perfect-freehand/${file}`
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
}
