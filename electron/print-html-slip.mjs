import { BrowserWindow } from 'electron'

/**
 * Silent (or dialog) print of an HTML data URL on 80mm thermal.
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
      sandbox: true
    }
  })

  try {
    await printWin.loadURL(dataUrl)
    await new Promise((resolve) => {
      const opts = {
        silent: config.silentPrint !== false,
        printBackground: true,
        margins: { marginType: 'none' }
      }
      if (config.printerName) {
        opts.deviceName = config.printerName
      }
      printWin.webContents.print(opts, (success, failureReason) => {
        if (!success) {
          console.warn('[print-html-slip]', failureReason)
        }
        resolve(undefined)
      })
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[print-html-slip]', message)
    return { ok: false, error: message }
  } finally {
    printWin.destroy()
  }
}
