/**
 * Writes config.json for packaging / first install from config.example.json.
 * Run: node scripts/prepare-kiosk-config.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const example = path.join(root, 'config.example.json')
const target = path.join(root, 'config.json')

if (!fs.existsSync(example)) {
  console.error('Missing config.example.json')
  process.exit(1)
}

if (fs.existsSync(target)) {
  console.log('config.json already exists — leave unchanged')
  process.exit(0)
}

fs.copyFileSync(example, target)
console.log('Created config.json — edit apiBaseUrl to your server LAN IP before npm run dist')
