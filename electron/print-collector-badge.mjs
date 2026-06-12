import { printHtmlSlip } from './print-html-slip.mjs'

/**
 * @param {import('electron').BrowserWindow} parentWin
 * @param {{ html: string }} payload — same document as browser `window.print()`
 * @param {{ printerName?: string, silentPrint?: boolean }} config
 */
export async function printCollectorBadge(parentWin, payload, config) {
  const html = typeof payload?.html === 'string' ? payload.html.trim() : ''
  if (!html) {
    return { ok: false, error: 'Missing collector badge HTML' }
  }
  return printHtmlSlip(parentWin, html, config)
}
