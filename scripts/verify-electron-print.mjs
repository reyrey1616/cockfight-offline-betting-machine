/**
 * Smoke-test bet slip printing in Electron (no Vite UI required).
 * Run: npm run verify:electron-print
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

import { app, BrowserWindow } from 'electron'

import { printHtmlSlip, verifySlipLayout } from '../electron/print-html-slip.mjs'
import { printBetTicket } from '../electron/print-bet-ticket.mjs'

const THERMAL_SLIP_CSS = `
    @page { margin: 0; size: 80mm auto; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 80mm; font-family: system-ui, sans-serif; color: #000; background: #fff; }
    .slip { width: 76mm; height: 60mm; margin: 0 auto; border: 2px solid #000; padding: 2mm; }
    .line { margin: 0; font-size: 8px; }
`

const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const SAMPLE_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><style>${THERMAL_SLIP_CSS}</style></head>
<body><div class="slip">
  <img src="${TINY_PNG}" width="120" height="40" alt="barcode" />
  <p class="line">Fight #: 1</p>
  <p class="line">Bet amount: 500.00</p>
  <p class="line">Teller: Test Teller</p>
</div></body></html>`

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function run() {
  const mainWin = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  })
  await mainWin.loadURL('about:blank')

  const layoutWin = new BrowserWindow({
    show: true,
    x: -3000,
    y: 0,
    width: 420,
    height: 720,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: false, backgroundThrottling: false }
  })
  const layoutPath = path.join(os.tmpdir(), `cockfight-verify-${randomUUID()}.html`)
  fs.writeFileSync(layoutPath, SAMPLE_HTML, 'utf8')
  await layoutWin.loadFile(layoutPath)
  await layoutWin.webContents.executeJavaScript(
    `new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })))`
  )
  await new Promise((r) => setTimeout(r, 900))
  const slipLayout = await verifySlipLayout(layoutWin.webContents)
  layoutWin.destroy()
  try {
    fs.unlinkSync(layoutPath)
  } catch {
    /* ignore */
  }
  assert(slipLayout.ok, `slip should render before print, got ${JSON.stringify(slipLayout)}`)

  const ipcStart = performance.now()
  void printBetTicket(mainWin, { html: SAMPLE_HTML }, { silentPrint: true, printerName: '' }).then((r) => {
    console.log('[verify] background print finished:', r)
  })
  const ipcMs = performance.now() - ipcStart
  assert(ipcMs < 500, `background print kickoff should return quickly, took ${ipcMs.toFixed(0)}ms`)

  const printStart = performance.now()
  const printResult = await printHtmlSlip(mainWin, SAMPLE_HTML, { silentPrint: true })
  const printMs = performance.now() - printStart
  assert(printMs < 25_000, `printHtmlSlip should finish within 25s, took ${printMs.toFixed(0)}ms`)

  const slipStart = performance.now()
  const slipResult = await printBetTicket(mainWin, { html: SAMPLE_HTML }, { silentPrint: true, printerName: '' })
  const slipMs = performance.now() - slipStart
  assert(slipMs < 25_000, `printBetTicket should finish within 25s, took ${slipMs.toFixed(0)}ms`)

  console.log(
    JSON.stringify(
      {
        ok: true,
        ipcReturnMs: Math.round(ipcMs),
        slipLayout,
        printHtmlSlipMs: Math.round(printMs),
        printHtmlSlipResult: printResult,
        printBetTicketMs: Math.round(slipMs),
        printBetTicketResult: slipResult,
        note:
          slipResult.ok
            ? 'Print reported success (check physical printer if connected).'
            : 'Print failed or timed out — expected without a thermal printer; UI must not hang.'
      },
      null,
      2
    )
  )

  mainWin.destroy()
}

app.whenReady().then(() => {
  run()
    .then(() => app.quit())
    .catch((err) => {
      console.error('[verify-electron-print] FAILED:', err)
      app.exit(1)
    })
})

app.on('window-all-closed', () => app.quit())
