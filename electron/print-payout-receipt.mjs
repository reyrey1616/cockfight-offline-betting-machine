import { printHtmlSlip } from './print-html-slip.mjs'

/**
 * @param {import('electron').BrowserWindow} parentWin
 * @param {{ html: string }} payload — same document as browser `window.print()`
 * @param {{ printerName?: string, silentPrint?: boolean }} config
 */
export async function printPayoutReceipt(parentWin, payload, config) {
  const html = typeof payload?.html === 'string' ? payload.html.trim() : ''
  if (!html) {
    return { ok: false, error: 'Missing payout receipt HTML' }
  }
  return printHtmlSlip(parentWin, html, config)
}
