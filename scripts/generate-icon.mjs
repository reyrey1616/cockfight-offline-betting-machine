/**
 * Builds build/icon.png (1024×1024) from FMJ logo for electron-builder (.dmg / .exe).
 * Run: npm run generate-icon
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const logoCandidates = [
  path.join(root, 'src/assets/fmj-logo.png'),
  path.join(root, 'public/fmj-logo.png')
]
const outDir = path.join(root, 'build')
const outPng = path.join(outDir, 'icon.png')

async function main() {
  const logoPath = logoCandidates.find((p) => fs.existsSync(p))
  if (!logoPath) {
    console.error('Missing FMJ logo. Expected one of:\n', logoCandidates.join('\n'))
    process.exit(1)
  }
  const sharp = (await import('sharp')).default
  fs.mkdirSync(outDir, { recursive: true })
  await sharp(logoPath)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(outPng)
  console.log('Wrote', outPng, 'from', logoPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
