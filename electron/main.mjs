import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app, BrowserWindow, ipcMain } from 'electron'

import { clientDistDir, loadDesktopConfig } from './config.mjs'
import { printPayoutReceipt } from './print-payout-receipt.mjs'
import { printBetTicket } from './print-bet-ticket.mjs'
import { printCashSlip } from './print-cash-slip.mjs'
import { printCollectorBadge } from './print-collector-badge.mjs'
import { startStaticServer } from './static-server.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('electron').BrowserWindow | null} */
let mainWindow = null
/** @type {(() => void) | null} */
let stopStaticServer = null

async function resolveAppUrl(config) {
  if (process.env.ELECTRON_APP_URL?.trim()) {
    return process.env.ELECTRON_APP_URL.trim()
  }

  const useBuiltClient =
    app.isPackaged ||
    process.env.ELECTRON_USE_DIST === '1' ||
    process.env.NODE_ENV === 'production'

  if (useBuiltClient) {
    const distDir = clientDistDir()
    const { baseUrl, close } = await startStaticServer(distDir)
    stopStaticServer = close
    const startPath = config.startPath?.trim() || '/kiosk'
    const routePath = startPath.startsWith('/') ? startPath : `/${startPath}`
    return new URL(routePath, baseUrl).toString()
  }

  return config.appUrl
}

async function createWindow() {
  const config = loadDesktopConfig()
  const appUrl = await resolveAppUrl(config)

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreen: config.kioskFullscreen,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  await mainWindow.loadURL(appUrl)

  if (!app.isPackaged && process.env.ELECTRON_DEVTOOLS === '1') {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

app.whenReady().then(() => {
  ipcMain.handle('get-kiosk-config', () => {
    const c = loadDesktopConfig()
    return {
      apiBaseUrl: c.apiBaseUrl?.trim() || null,
      silentPrint: c.silentPrint !== false,
      printerName: c.printerName?.trim() || null
    }
  })

  ipcMain.handle('get-desktop-config', () => {
    const c = loadDesktopConfig()
    return {
      apiBaseUrl: c.apiBaseUrl || '(using build default)',
      silentPrint: c.silentPrint,
      printerName: c.printerName ? '(configured)' : '(system default)'
    }
  })

  ipcMain.handle('print-bet-ticket', async (_evt, payload) => {
    if (!mainWindow) return { ok: false, error: 'No window' }
    const config = loadDesktopConfig()
    return printBetTicket(mainWindow, payload, config)
  })

  ipcMain.handle('print-collector-badge', async (_evt, payload) => {
    if (!mainWindow) return { ok: false, error: 'No window' }
    const config = loadDesktopConfig()
    return printCollectorBadge(mainWindow, payload, config)
  })

  ipcMain.handle('print-cash-slip', async (_evt, payload) => {
    if (!mainWindow) return { ok: false, error: 'No window' }
    const config = loadDesktopConfig()
    return printCashSlip(mainWindow, payload, config)
  })

  ipcMain.handle('print-payout-receipt', async (_evt, payload) => {
    if (!mainWindow) return { ok: false, error: 'No window' }
    const config = loadDesktopConfig()
    return printPayoutReceipt(mainWindow, payload, config)
  })

  return createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow()
  }
})

app.on('before-quit', () => {
  stopStaticServer?.()
})
