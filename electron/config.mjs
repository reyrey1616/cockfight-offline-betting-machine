import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app } from 'electron'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULTS = {
  /** Dev only — production loads UI from bundled files. */
  appUrl: 'http://localhost:5173/kiosk',
  /**
   * Packaged app route after static server starts. Teller kiosks: `/kiosk`.
   * Server PC for collector badge printing: `/admin/collectors`.
   */
  startPath: '/kiosk',
  /**
   * LAN API origin — IP of the **server** PC (required in production).
   * Same value on every teller kiosk at a site; never localhost on kiosk machines.
   * Example: http://192.168.1.6:8000
   */
  apiBaseUrl: '',
  printerName: '',
  silentPrint: true,
  kioskFullscreen: true
}

function configCandidates() {
  const roots = [
    process.cwd(),
    path.join(__dirname, '..'),
    app.isPackaged ? path.dirname(process.execPath) : null
  ].filter(Boolean)

  const names = ['config.json', 'config.local.json']
  const files = []
  for (const root of roots) {
    for (const name of names) {
      files.push(path.join(root, name))
    }
  }
  if (app.isPackaged) {
    files.unshift(path.join(process.resourcesPath, 'config.json'))
    files.unshift(path.join(process.resourcesPath, 'config.local.json'))
    files.push(path.join(app.getAppPath(), 'config.json'))
    files.push(path.join(app.getAppPath(), 'config.local.json'))
  }
  return files
}

/**
 * @returns {typeof DEFAULTS}
 */
export function loadDesktopConfig() {
  let merged = { ...DEFAULTS }
  for (const file of configCandidates()) {
    if (!fs.existsSync(file)) continue
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
      merged = { ...merged, ...raw }
    } catch {
      // ignore invalid JSON
    }
  }
  if (process.env.ELECTRON_APP_URL?.trim()) {
    merged.appUrl = process.env.ELECTRON_APP_URL.trim()
  }
  if (process.env.ELECTRON_PRINTER_NAME?.trim()) {
    merged.printerName = process.env.ELECTRON_PRINTER_NAME.trim()
  }
  if (process.env.ELECTRON_API_BASE_URL?.trim()) {
    merged.apiBaseUrl = process.env.ELECTRON_API_BASE_URL.trim()
  }
  return merged
}

export function clientDistDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'client-dist')
  }
  return path.resolve(__dirname, '../dist')
}
