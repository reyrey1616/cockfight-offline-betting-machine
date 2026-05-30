/** Fields for 80mm thermal cash ADV/REM receipts. */
export interface CashSlipFields {
  kind: 'deposit' | 'remit'
  code: string
  amount: string
  collectorName: string
  tellerName: string
  notes?: string
  barcodePngDataUrl: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Keep in sync with desktop `electron/print-cash-slip.mjs`. */
export const CASH_SLIP_CSS = `
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
    .title {
      flex: 0 0 auto;
      margin: 0;
      font-size: 10px;
      font-weight: 800;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.04em;
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
    .label { font-weight: 700; }
    .value { font-size: 10px; font-weight: 600; }
    .code-value {
      font-family: ui-monospace, monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
    }
`

export function buildCashSlipHtml(fields: CashSlipFields): string {
  const title = fields.kind === 'deposit' ? 'Cash deposit' : 'Cash remittance'
  const collector = escapeHtml(fields.collectorName.trim() || '—')
  const teller = escapeHtml(fields.tellerName.trim() || '—')
  const amount = escapeHtml(fields.amount)
  const code = escapeHtml(fields.code)
  const notesLine = fields.notes?.trim()
    ? `<p class="line"><span class="label">Notes:</span> <span class="value">${escapeHtml(fields.notes.trim())}</span></p>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${CASH_SLIP_CSS}
  </style>
</head>
<body>
  <div class="slip">
    <p class="title">${escapeHtml(title)}</p>
    <div class="barcode-wrap">
      <img class="barcode" src="${fields.barcodePngDataUrl}" alt="${code}" />
    </div>
    <div class="meta">
      <p class="line"><span class="label">Amount:</span> <span class="value">${amount}</span></p>
      <p class="line"><span class="label">Collector:</span> <span class="value">${collector}</span></p>
      <p class="line"><span class="label">Teller:</span> <span class="value">${teller}</span></p>
      <p class="line"><span class="label">Receipt:</span> <span class="value code-value">${code}</span></p>
      ${notesLine}
    </div>
  </div>
</body>
</html>`
}
