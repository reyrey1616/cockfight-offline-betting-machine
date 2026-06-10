import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'

import { BrowserWindow } from 'electron'

const PRINT_TIMEOUT_MS = 20_000
/** Silent `webContents.print` often races the compositor — browser `window.print()` does not. */
const SILENT_PRINT_SETTLE_MS = 900

const VIRTUAL_PRINTER_RE = /pdf|xps|one note|onenote|fax|send to|microsoft print/i
const THERMAL_PRINTER_RE = /xp-k200|xprinter|thermal|pos|receipt|80mm/i

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
  await webContents.executeJavaScript(`document.fonts?.ready ?? Promise.resolve()`)
}

async function resolvePrinterName(webContents, configuredName) {
  const trimmed = configuredName?.trim()
  if (trimmed) return trimmed

  try {
    const printers = await webContents.getPrintersAsync()
    const physical = printers.filter((p) => !VIRTUAL_PRINTER_RE.test(p.name))
    const thermal = physical.find((p) => THERMAL_PRINTER_RE.test(p.name))
    const pick =
      thermal ??
      physical.find((p) => p.isDefault) ??
      physical[0] ??
      printers.find((p) => p.isDefault) ??
      printers[0]
    return pick?.name ?? ''
  } catch (err) {
    console.warn('[print-html-slip] getPrintersAsync failed', err)
    return ''
  }
}

/**
 * Match browser print: `@page { size: 80mm auto }` — no fixed micron height.
 * Fixed height caused short blank feeds on thermal drivers.
 */
function buildPrintOptions(config, deviceName) {
  const opts = {
    silent: config.silentPrint !== false,
    printBackground: true,
    margins: { marginType: 'none' },
    landscape: false,
    preferCSSPageSize: true
  }

  if (deviceName) {
    opts.deviceName = deviceName
  }

  if (deviceName && THERMAL_PRINTER_RE.test(deviceName)) {
    opts.dpi = { horizontal: 203, vertical: 203 }
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

/** Force a paint pass before silent print (hidden/off-screen windows often rasterize blank). */
async function forcePaint(webContents) {
  await webContents.executeJavaScript('void document.body.offsetHeight')
  const slipRect = await webContents.executeJavaScript(`
    (() => {
      const slip = document.querySelector('.slip');
      if (!slip) return null;
      const r = slip.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    })()
  `)

  if (slipRect?.width > 0 && slipRect?.height > 0) {
    await webContents.capturePage(slipRect)
  } else {
    await webContents.capturePage()
  }
}

export async function verifySlipLayout(webContents) {
  try {
    return await webContents.executeJavaScript(`
      (() => {
        const slip = document.querySelector('.slip');
        if (!slip) return { ok: false, reason: 'missing .slip' };
        const rect = slip.getBoundingClientRect();
        const text = (slip.innerText || '').trim();
        return {
          ok: rect.height >= 40 && rect.width >= 40 && text.length > 8,
          height: rect.height,
          width: rect.width,
          textLen: text.length
        };
      })()
    `)
  } catch {
    return { ok: false, reason: 'layout check failed' }
  }
}

function writeTempHtml(html) {
  const filePath = path.join(os.tmpdir(), `cockfight-slip-${randomUUID()}.html`)
  fs.writeFileSync(filePath, html, 'utf8')
  return filePath
}

function removeTempHtml(filePath) {
  try {
    fs.unlinkSync(filePath)
  } catch {
    /* ignore */
  }
}

/**
 * Silent print of slip HTML using the same document the browser prints.
 *
 * @param {import('electron').BrowserWindow} _parentWin
 * @param {string} html — full slip document from `buildBetTicketSlipHtml` (renderer)
 * @param {{ printerName?: string, silentPrint?: boolean }} config
 */
export async function printHtmlSlip(_parentWin, html, config) {
  const tmpPath = writeTempHtml(html)

  // Off-screen but shown: Chromium paints; `show:false` silent prints are often blank on Windows.
  const printWin = new BrowserWindow({
    show: true,
    x: -3000,
    y: 0,
    width: 420,
    height: 720,
    frame: false,
    skipTaskbar: true,
    autoHideMenuBar: true,
    paintWhenInitiallyHidden: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false
    }
  })

  try {
    try {
      await printWin.loadURL(pathToFileURL(tmpPath).href)
    } catch (loadErr) {
      console.warn('[print-html-slip] file load failed, using data URL', loadErr)
      await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    }
    await waitForPrintReady(printWin.webContents)
    await new Promise((resolve) => setTimeout(resolve, SILENT_PRINT_SETTLE_MS))

    const layout = await verifySlipLayout(printWin.webContents)
    if (!layout.ok) {
      console.warn('[print-html-slip] slip not ready before print', layout)
      return { ok: false, error: layout.reason ?? 'Slip layout not ready' }
    }

    await forcePaint(printWin.webContents)

    const deviceName = await resolvePrinterName(printWin.webContents, config.printerName)
    const opts = buildPrintOptions(config, deviceName)

    const result = await printWithTimeout(printWin.webContents, opts, printWin)

    // Let the spooler finish before tearing down the window (silent print race).
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (!result.success) {
      console.warn('[print-html-slip]', result.failureReason, {
        deviceName,
        silent: opts.silent,
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
    removeTempHtml(tmpPath)
    if (!printWin.isDestroyed()) {
      printWin.destroy()
    }
  }
}
