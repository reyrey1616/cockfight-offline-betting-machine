/**
 * Smoke-test bet slip printing in Electron (no Vite UI required).
 * Run: npx electron scripts/verify-electron-print.mjs
 */
import { app, BrowserWindow } from 'electron'

import { buildBetTicketPrintHtml } from '../electron/print-bet-ticket.mjs'
import { BET_SLIP_PAGE_HEIGHT_MM, printHtmlSlip, verifySlipLayout } from '../electron/print-html-slip.mjs'
import { printBetTicket } from '../electron/print-bet-ticket.mjs'
import { mmToPx } from '../electron/thermal-px.mjs'

const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const SAMPLE_TICKET = {
  code: 'AB12CD34',
  fightNumber: '1',
  bettingSide: 'Meron',
  betAmount: '500.00',
  tellerName: 'Test Teller',
  placedAt: 'May 30, 2026, 6:00 PM',
  barcodePngDataUrl: TINY_PNG
}

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

  assert(BET_SLIP_PAGE_HEIGHT_MM === 66, `expected BET_SLIP_PAGE_HEIGHT_MM 66, got ${BET_SLIP_PAGE_HEIGHT_MM}`)

  const layoutWin = new BrowserWindow({
    show: false,
    width: mmToPx(80),
    height: mmToPx(BET_SLIP_PAGE_HEIGHT_MM),
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: false }
  })
  await layoutWin.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(buildBetTicketPrintHtml(SAMPLE_TICKET))}`
  )
  await layoutWin.webContents.executeJavaScript(
    `new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })))`
  )
  await new Promise((r) => setTimeout(r, 400))
  const slipLayout = await verifySlipLayout(layoutWin.webContents)
  layoutWin.destroy()
  assert(slipLayout.ok, `bet slip should render with height >= 80px, got ${JSON.stringify(slipLayout)}`)

  const ipcStart = performance.now()
  const ipcResult = { ok: true }
  void printBetTicket(mainWin, SAMPLE_TICKET, { silentPrint: true, printerName: '' }).then((r) => {
    console.log('[verify] background print finished:', r)
  })
  const ipcMs = performance.now() - ipcStart
  assert(ipcResult.ok === true, 'IPC-style handler should return ok immediately')
  assert(ipcMs < 200, `IPC path should return in <200ms, took ${ipcMs.toFixed(0)}ms`)

  const printStart = performance.now()
  const printResult = await printHtmlSlip(mainWin, '<html><body>ok</body></html>', {
    silentPrint: true,
    pageHeightMm: BET_SLIP_PAGE_HEIGHT_MM
  })
  const printMs = performance.now() - printStart
  assert(printMs < 15_000, `printHtmlSlip should finish within 15s, took ${printMs.toFixed(0)}ms`)

  const slipStart = performance.now()
  const slipResult = await printBetTicket(mainWin, SAMPLE_TICKET, {
    silentPrint: true,
    printerName: ''
  })
  const slipMs = performance.now() - slipStart
  assert(slipMs < 15_000, `printBetTicket should finish within 15s, took ${slipMs.toFixed(0)}ms`)

  console.log(
    JSON.stringify(
      {
        ok: true,
        ipcReturnMs: Math.round(ipcMs),
        printHtmlSlipMs: Math.round(printMs),
        printHtmlSlipResult: printResult,
        printBetTicketMs: Math.round(slipMs),
        printBetTicketResult: slipResult,
        note:
          slipResult.ok
            ? 'Print reported success (check physical printer if connected).'
            : 'Print failed or timed out — expected in CI without a thermal printer; UI must not hang.'
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
