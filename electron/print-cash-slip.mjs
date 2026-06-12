import { printHtmlSlip } from './print-html-slip.mjs'

/**
 * @param {import('electron').BrowserWindow} parentWin
 * @param {{ html: string }} payload — same document as browser `window.print()`
 * @param {{ printerName?: string, silentPrint?: boolean }} config
 */
export async function printCashSlip(parentWin, slip, config) {
  const html = typeof slip?.html === 'string' ? slip.html.trim() : ''
  if (!html) {
    return { ok: false, error: 'Missing cash slip HTML' }
  }
  return printHtmlSlip(parentWin, html, config)
}
