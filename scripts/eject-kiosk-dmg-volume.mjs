/**
 * Eject a leftover DMG mount from a previous electron-builder run.
 * Run automatically before `npm run dist` / `npm run pack`.
 */
import { execSync } from 'node:child_process'

const VOLUME_NAMES = [
  'FMJ offline betting machine',
  'Cockfight Betting Kiosk'
]

function listMounts() {
  try {
    return execSync('hdiutil info', { encoding: 'utf8' })
  } catch {
    return ''
  }
}

function tryDetach(volumeName) {
  const mountPath = `/Volumes/${volumeName}`
  try {
    execSync(`hdiutil detach "${mountPath}" -force -quiet`, { stdio: 'ignore' })
    console.log(`Ejected ${mountPath}`)
    return true
  } catch {
    return false
  }
}

const info = listMounts()
let ejected = false
for (const name of VOLUME_NAMES) {
  if (info.includes(`/Volumes/${name}`)) {
    ejected = tryDetach(name) || ejected
  }
}

if (!ejected) {
  console.log('No leftover kiosk DMG volumes to eject.')
}
