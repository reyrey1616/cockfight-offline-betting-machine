import { formatSlipTimestamp } from '@/lib/thermal-slip-76x60-css'

/** Fields printed on 80mm thermal payout receipts (76mm × 40mm). */
export interface PayoutReceiptSlipFields {
  fightNumber: string
  bettingSide: string
  betAmount: string
  payoutAmount: string
  paidAt: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Keep in sync with desktop `electron/print-payout-receipt.mjs`. */
export const PAYOUT_RECEIPT_SLIP_CSS = `
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
      height: 40mm;
      margin: 0 auto;
      border: 2px solid #000;
      padding: 1.5mm 2mm 1mm;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 0;
      overflow: hidden;
    }
    .title {
      margin: 0 0 1mm;
      font-size: 8px;
      font-weight: 800;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      line-height: 1.2;
    }
    .meta {
      flex: 0 0 auto;
      width: 100%;
    }
    .line {
      margin: 0;
      font-size: 7.5px;
      line-height: 1.25;
      text-align: left;
      word-break: break-word;
    }
    .line + .line { margin-top: 0.5mm; }
    .label { font-weight: 700; }
    .value { font-size: 8px; font-weight: 600; }
    .emphasis { font-size: 9px; font-weight: 800; }
    .cut {
      margin: 1mm 0 0;
      padding-top: 1mm;
      border-top: 1px dashed #000;
      font-size: 7px;
      font-weight: 700;
      text-align: center;
      letter-spacing: 0.04em;
      line-height: 1.2;
    }
`

export function buildPayoutReceiptSlipHtml(fields: PayoutReceiptSlipFields): string {
  const fightNumber = escapeHtml(fields.fightNumber)
  const bettingSide = escapeHtml(fields.bettingSide)
  const betAmount = escapeHtml(fields.betAmount)
  const payoutAmount = escapeHtml(fields.payoutAmount)
  const paidAt = escapeHtml(fields.paidAt)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${PAYOUT_RECEIPT_SLIP_CSS}
  </style>
</head>
<body>
  <div class="slip">
    <p class="title">Payout receipt</p>
    <div class="meta">
      <p class="line"><span class="label">Fight number:</span> <span class="value">${fightNumber}</span></p>
      <p class="line"><span class="label">Betting side:</span> <span class="value">${bettingSide}</span></p>
      <p class="line"><span class="label">Bet:</span> <span class="value">${betAmount}</span></p>
      <p class="line"><span class="label">Payout:</span> <span class="value emphasis">${payoutAmount}</span></p>
      <p class="line"><span class="label">Date and timestamp:</span> <span class="value">${paidAt}</span></p>
    </div>
    <p class="cut">&lt;&lt;&lt;CUT HERE&gt;&gt;&gt;</p>
  </div>
</body>
</html>`
}

/** @deprecated Use `formatSlipTimestamp` from `thermal-slip-76x60-css`. */
export function formatPayoutReceiptTimestamp(iso: string): string {
  return formatSlipTimestamp(iso)
}

export { formatSlipTimestamp }
