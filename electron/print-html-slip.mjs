import { BrowserWindow } from 'electron'

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

/**
 * Match browser `window.print()` — use CSS `@page` (e.g. `80mm auto`), not a fixed
 * 200mm Electron pageSize (wastes paper at top) or a short custom pageSize where
 * width > height (often prints landscape on thermal drivers).
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
  return opts
}

/**
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
    height: 480,
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
