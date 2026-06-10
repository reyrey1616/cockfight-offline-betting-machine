import { mmToPx, ROLL_WIDTH_MM } from './thermal-px.mjs'
import { BET_SLIP_PAGE_HEIGHT_MM, printHtmlSlip } from './print-html-slip.mjs'

/** Electron print CSS in px — browser keeps mm in `thermal-slip-76x60-css.ts`. */
const PAGE_W = mmToPx(ROLL_WIDTH_MM)
const PAGE_H = mmToPx(BET_SLIP_PAGE_HEIGHT_MM)
const SLIP_W = mmToPx(76)
const SLIP_H = mmToPx(60)

const THERMAL_SLIP_BET_PRINT_CSS = `
    @page { margin: 0; size: ${PAGE_W}px ${PAGE_H}px; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: ${PAGE_W}px;
      height: ${PAGE_H}px;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .slip {
      width: ${SLIP_W}px;
      height: ${SLIP_H}px;
      margin: 0 auto;
      border: 2px solid #000;
      padding: 8px 8px 4px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 4px;
      overflow: hidden;
    }
    .barcode-wrap {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      max-height: 83px;
      padding: 2px 0;
      overflow: hidden;
    }
    .barcode {
      display: block;
      width: 100%;
      max-width: 100%;
      max-height: 83px;
      height: auto;
      object-fit: contain;
    }
    .meta {
      flex: 1 1 auto;
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }
    .line {
      margin: 0;
      font-size: 8px;
      line-height: 1.3;
      text-align: left;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .line + .line { margin-top: 3px; }
    .label { font-weight: 700; }
    .value { font-size: 9px; font-weight: 600; }
    .emphasis { font-size: 10px; font-weight: 800; }
`

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildBetTicketPrintHtml(fields) {
  const fightNumber = escapeHtml(fields.fightNumber)
  const bettingSide = escapeHtml(fields.bettingSide)
  const betAmount = escapeHtml(fields.betAmount)
  const teller = escapeHtml(String(fields.tellerName || '').trim() || '—')
  const placedAt = escapeHtml(fields.placedAt)
  const code = escapeHtml(fields.code)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${THERMAL_SLIP_BET_PRINT_CSS}
  </style>
</head>
<body>
  <div class="slip">
    <div class="barcode-wrap">
      <img class="barcode" src="${fields.barcodePngDataUrl}" alt="${code}" />
    </div>
    <div class="meta">
      <p class="line"><span class="label">Fight #:</span> <span class="value">${fightNumber}</span></p>
      <p class="line"><span class="label">Betting side:</span> <span class="value">${bettingSide}</span></p>
      <p class="line"><span class="label">Bet amount:</span> <span class="value emphasis">${betAmount}</span></p>
      <p class="line"><span class="label">Teller:</span> <span class="value">${teller}</span></p>
      <p class="line"><span class="label">Date and timestamp:</span> <span class="value">${placedAt}</span></p>
    </div>
  </div>
</body>
</html>`
}

/**
 * @param {import('electron').BrowserWindow} parentWin
 * @param {{
 *   code: string
 *   fightNumber: string
 *   bettingSide: string
 *   betAmount: string
 *   tellerName: string
 *   placedAt: string
 *   barcodePngDataUrl: string
 * }} ticket
 * @param {{ printerName?: string, silentPrint?: boolean }} config
 */
export async function printBetTicket(parentWin, ticket, config) {
  return printHtmlSlip(parentWin, buildBetTicketPrintHtml(ticket), {
    ...config,
    pageHeightMm: BET_SLIP_PAGE_HEIGHT_MM,
    pageWidthPx: PAGE_W,
    pageHeightPx: PAGE_H
  })
}
