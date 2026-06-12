/** Fields for 80mm thermal cash ADV/REM receipts (72mm safe width). */
export interface CashSlipFields {
  kind: 'deposit' | 'remit'
  code: string
  amount: string
  collectorName: string
  tellerName: string
  recordedAt: string
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

/** Matches bet-slip thermal typography (72mm safe width, larger sharp text). */
export const CASH_SLIP_CSS = `
    @page { margin: 0; size: 72mm auto; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 72mm;
      max-width: 72mm;
      overflow: visible;
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      color: #000;
      background: #fff;
      -webkit-font-smoothing: none;
      font-smooth: never;
    }
    .slip {
      width: 72mm;
      max-width: 72mm;
      height: auto;
      max-height: 52mm;
      margin: 0;
      border: 2px solid #000;
      padding: 1.5mm 1.5mm 1mm;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 0.5mm;
      overflow: visible;
    }
    .title {
      flex: 0 0 auto;
      margin: 0 0 0.35mm;
      font-size: 12px;
      font-weight: 800;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      line-height: 1.1;
    }
    .barcode-wrap {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 0;
      max-height: 18mm;
      padding: 0.25mm 1mm 0;
      overflow: visible;
      gap: 0.25mm;
    }
    .barcode {
      display: block;
      width: 100%;
      max-width: 100%;
      max-height: 12mm;
      height: auto;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .barcode-code {
      margin: 0;
      padding: 0;
      font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
      font-size: 12px;
      font-weight: 800;
      line-height: 1;
      letter-spacing: 0.08em;
      text-align: center;
      text-transform: uppercase;
    }
    .meta {
      flex: 0 0 auto;
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }
    .line {
      margin: 0;
      font-size: 12px;
      line-height: 1.15;
      text-align: left;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .line + .line { margin-top: 0.35mm; }
    .label { font-weight: 800; }
    .value { font-size: 13px; font-weight: 700; }
    .emphasis { font-size: 15px; font-weight: 800; }
    @media print {
      html, body {
        width: 72mm !important;
        height: auto !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .slip {
        width: 72mm;
        height: auto;
        max-height: 52mm;
        overflow: visible;
      }
    }
`

export function buildCashSlipHtml(fields: CashSlipFields): string {
  const title = fields.kind === 'deposit' ? 'Cash deposit' : 'Cash remittance'
  const collector = escapeHtml(fields.collectorName.trim() || '—')
  const teller = escapeHtml(fields.tellerName.trim() || '—')
  const amount = escapeHtml(fields.amount)
  const code = escapeHtml(fields.code)
  const recordedAt = escapeHtml(fields.recordedAt)
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
      <p class="barcode-code">${code}</p>
    </div>
    <div class="meta">
      <p class="line"><span class="label">Amount:</span> <span class="value emphasis">${amount}</span></p>
      <p class="line"><span class="label">Collector:</span> <span class="value">${collector}</span></p>
      <p class="line"><span class="label">Teller:</span> <span class="value">${teller}</span></p>
      <p class="line"><span class="label">Date &amp; time:</span> <span class="value">${recordedAt}</span></p>
      ${notesLine}
    </div>
  </div>
</body>
</html>`
}
