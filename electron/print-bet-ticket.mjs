import { printHtmlSlip } from './print-html-slip.mjs'

/** Inlined from machine-client `bet-ticket-slip-html.ts` — keep in sync. */
const BET_TICKET_SLIP_CSS = `
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
      height: 76mm;
      margin: 0 auto;
      border: 2px solid #000;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 1.5mm;
    }
    .barcode-wrap {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 0;
      padding: 1mm 0;
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
      padding: 0 1mm 0.5mm;
    }
    .line {
      margin: 0;
      font-size: 9px;
      line-height: 1.35;
      text-align: left;
      word-break: break-word;
    }
    .line + .line { margin-top: 1mm; }
    .label {
      font-weight: 700;
      text-transform: none;
    }
    .value {
      font-size: 10px;
      font-weight: 600;
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
  const teller = escapeHtml(String(fields.tellerName || '').trim() || '—')
  const amount = escapeHtml(fields.amount)
  const code = escapeHtml(fields.code)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${BET_TICKET_SLIP_CSS}
  </style>
</head>
<body>
  <div class="slip">
    <div class="barcode-wrap">
      <img class="barcode" src="${fields.barcodePngDataUrl}" alt="${code}" />
    </div>
    <div class="meta">
      <p class="line"><span class="label">Bet amount:</span> <span class="value">${amount}</span></p>
      <p class="line"><span class="label">Teller:</span> <span class="value">${teller}</span></p>
    </div>
  </div>
</body>
</html>`
}

/**
 * 80mm thermal slip — keep layout aligned with
 * machine-client `src/lib/bet-ticket-slip-html.ts`.
 *
 * @param {import('electron').BrowserWindow} parentWin
 * @param {{
 *   code: string
 *   amount: string
 *   tellerName: string
 *   barcodePngDataUrl: string
 * }} ticket
 * @param {{ printerName?: string, silentPrint?: boolean }} config
 */
export async function printBetTicket(parentWin, ticket, config) {
  return printHtmlSlip(parentWin, buildTicketHtml(ticket), config)
}
