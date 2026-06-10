import { BrowserWindow } from 'electron'

import { mmToPx, ROLL_WIDTH_MM } from './thermal-px.mjs'

const THERMAL_PAGE_WIDTH_MICRONS = ROLL_WIDTH_MM * 1000
const PRINT_TIMEOUT_MS = 12_000
const LAYOUT_SETTLE_MS = 350

const VIRTUAL_PRINTER_RE = /pdf|xps|one note|onenote|fax|send to|microsoft print/i

async function waitForPrintReady(webContents) {
  await webContents.executeJavaScript(`
    new Promise((resolve) => {
      const finish = () => resolve(true);
      const waitImages = () => {
        const imgs = [...document.images];
        if (imgs.length === 0) return finish();
        Promise.all(
          imgs.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((r) => { img.onload = img.onerror = r; })
          )
        ).then(finish);
      };
      if (document.readyState === 'complete') {
        waitImages();
      } else {
        window.addEventListener('load', waitImages, { once: true });
      }
    })
  `)
  await new Promise((resolve) => setTimeout(resolve, LAYOUT_SETTLE_MS))
}

async function resolvePrinterName(webContents, configuredName) {
  const trimmed = configuredName?.trim()
  if (trimmed) return trimmed

  try {
    const printers = await webContents.getPrintersAsync()
    const physical = printers.filter((p) => !VIRTUAL_PRINTER_RE.test(p.name))
    const thermal = physical.find((p) => /xp-k200|thermal|pos|receipt|80mm/i.test(p.name))
    const pick = thermal ?? physical.find((p) => p.isDefault) ?? physical[0] ?? printers.find((p) => p.isDefault) ?? printers[0]
    return pick?.name ?? ''
  } catch (err) {
    console.warn('[print-html-slip] getPrintersAsync failed', err)
    return ''
  }
}

function buildPrintOptions(config, deviceName) {
  const pageHeightMm = typeof config.pageHeightMm === 'number' ? config.pageHeightMm : 66
  const opts = {
    silent: config.silentPrint !== false,
    printBackground: true,
    margins: { marginType: 'none' },
    landscape: false,
    preferCSSPageSize: false,
    pageSize: {
      width: THERMAL_PAGE_WIDTH_MICRONS,
      height: Math.round(pageHeightMm * 1000)
    }
  }
  if (deviceName) {
    opts.deviceName = deviceName
  }
  return opts
}

function printWithTimeout(webContents, opts, printWin, timeoutMs = PRINT_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }

    const timer = setTimeout(() => {
      console.warn('[print-html-slip] print timed out — closing print window', {
        timeoutMs,
        deviceName: opts.deviceName
      })
      if (!printWin.isDestroyed()) {
        printWin.destroy()
      }
      finish({ success: false, failureReason: 'Print timed out' })
    }, timeoutMs)

    webContents.print(opts, (success, failureReason) => {
      finish({ success, failureReason: failureReason ?? 'Print failed' })
    })
  })
}

async function fitPrintWindow(printWin, config) {
  const widthPx = config.pageWidthPx ?? mmToPx(ROLL_WIDTH_MM)
  const heightPx = config.pageHeightPx ?? mmToPx(config.pageHeightMm ?? 66)
  printWin.setContentSize(Math.max(widthPx, 200), Math.max(heightPx, 200))
  await printWin.webContents.setZoomFactor(1)
}

export async function verifySlipLayout(webContents) {
  try {
    return await webContents.executeJavaScript(`
      (() => {
        const slip = document.querySelector('.slip');
        if (!slip) return { ok: false, reason: 'missing .slip' };
        const rect = slip.getBoundingClientRect();
        return { ok: rect.height >= 80, height: rect.height, width: rect.width };
      })()
    `)
  } catch {
    return { ok: false, reason: 'layout check failed' }
  }
}

/**
 * @param {import('electron').BrowserWindow} _parentWin
 * @param {string} html
 * @param {{
 *   printerName?: string
 *   silentPrint?: boolean
 *   pageHeightMm?: number
 *   pageWidthPx?: number
 *   pageHeightPx?: number
 * }} config
 */
export async function printHtmlSlip(_parentWin, html, config) {
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`

  const printWin = new BrowserWindow({
    show: false,
    width: config.pageWidthPx ?? mmToPx(ROLL_WIDTH_MM),
    height: config.pageHeightPx ?? mmToPx(config.pageHeightMm ?? 66),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  try {
    await printWin.loadURL(dataUrl)
    await waitForPrintReady(printWin.webContents)
    await fitPrintWindow(printWin, config)

    const layout = await verifySlipLayout(printWin.webContents)
    if (!layout.ok) {
      console.warn('[print-html-slip] slip layout too small before print', layout)
    }

    const deviceName = await resolvePrinterName(printWin.webContents, config.printerName)
    const opts = buildPrintOptions(config, deviceName)

    const result = await printWithTimeout(printWin.webContents, opts, printWin)

    if (!result.success) {
      console.warn('[print-html-slip]', result.failureReason, {
        deviceName,
        silent: opts.silent,
        pageHeightMm: config.pageHeightMm ?? 66,
        layout
      })
      return { ok: false, error: result.failureReason }
    }

    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[print-html-slip]', message)
    return { ok: false, error: message }
  } finally {
    if (!printWin.isDestroyed()) {
      printWin.destroy()
    }
  }
}

/** 60mm slip + border — bet ticket Electron page height. */
export const BET_SLIP_PAGE_HEIGHT_MM = 66
