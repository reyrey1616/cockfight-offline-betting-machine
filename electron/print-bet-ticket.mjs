import { printHtmlSlip } from './print-html-slip.mjs'

/** Inlined from machine-client `thermal-slip-76x60-css.ts` — keep in sync. */
const THERMAL_SLIP_76X60_CSS = `
    @page { margin: 0; size: 80mm auto; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2mm;
      width: 80mm;
      font-family: system-ui, -apple-system, sans-serif;
      color: #000;
      background: #fff;
    }
    .slip {
      width: 76mm;
      height: 60mm;
      margin: 0 auto;
      border: 2px solid #000;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 1mm;
      overflow: hidden;
    }
    .barcode-wrap {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 0;
      max-height: 26mm;
      padding: 0.5mm 0;
    }
    .barcode {
      display: block;
      width: 100%;
      max-width: 100%;
      max-height: 100%;
      height: auto;
      object-fit: contain;
    }
    .meta {
      flex: 0 0 auto;
      width: 100%;
    }
    .title {
      flex: 0 0 auto;
      margin: 0 0 1mm;
      font-size: 9px;
      font-weight: 800;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .line {
      margin: 0;
      font-size: 8px;
      line-height: 1.3;
      text-align: left;
      word-break: break-word;
    }
    .line + .line { margin-top: 0.75mm; }
    .label { font-weight: 700; }
    .value { font-size: 9px; font-weight: 600; }
    .emphasis { font-size: 10px; font-weight: 800; }
    .cut {
      flex: 0 0 auto;
      margin-top: auto;
      padding-top: 1.5mm;
      border-top: 1px dashed #000;
      font-size: 8px;
      font-weight: 700;
      text-align: center;
      letter-spacing: 0.04em;
    }
`

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildTicketHtml(fields) {
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
  <style>${THERMAL_SLIP_76X60_CSS}
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
 * 76mm × 60mm thermal bet slip — keep aligned with
 * machine-client `src/lib/bet-ticket-slip-html.ts`.
 *
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
  return printHtmlSlip(parentWin, buildTicketHtml(ticket), config)
}
