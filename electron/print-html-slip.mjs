import { BrowserWindow } from 'electron'

/** 80mm thermal roll width; height is a generous cap for short slips. Microns (1 mm = 1000). */
const THERMAL_PAGE_WIDTH_MICRONS = 80_000
const THERMAL_PAGE_HEIGHT_MICRONS = 200_000

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
  await new Promise((resolve) => setTimeout(resolve, 150))
}

/**
 * Pick a physical printer: configured name, else default (skip PDF/XPS virtual printers).
 * @param {import('electron').WebContents} webContents
 * @param {string | undefined} configuredName
 */
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
  const opts = {
    silent: config.silentPrint !== false,
    printBackground: true,
    margins: { marginType: 'none' },
    pageSize: {
      width: THERMAL_PAGE_WIDTH_MICRONS,
      height: THERMAL_PAGE_HEIGHT_MICRONS
    }
  }
  if (deviceName) {
    opts.deviceName = deviceName
  }
  return opts
}

/**
 * Silent (or dialog) print of HTML on 80mm thermal.
 *
 * @param {import('electron').BrowserWindow} parentWin
 * @param {string} html
 * @param {{ printerName?: string, silentPrint?: boolean }} config
 */
export async function printHtmlSlip(parentWin, html, config) {
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`

  const printWin = new BrowserWindow({
    show: false,
    parent: parentWin,
    width: 320,
    height: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  try {
    await printWin.loadURL(dataUrl)
    await waitForPrintReady(printWin.webContents)

    const deviceName = await resolvePrinterName(printWin.webContents, config.printerName)
    const opts = buildPrintOptions(config, deviceName)

    const result = await new Promise((resolve) => {
      printWin.webContents.print(opts, (success, failureReason) => {
        resolve({ success, failureReason: failureReason ?? 'Print failed' })
      })
    })

    if (!result.success) {
      console.warn('[print-html-slip]', result.failureReason, { deviceName, silent: opts.silent })
      return { ok: false, error: result.failureReason }
    }

    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[print-html-slip]', message)
    return { ok: false, error: message }
  } finally {
    printWin.destroy()
  }
}
