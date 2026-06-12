import { formatSlipTimestamp } from '@/lib/thermal-slip-76x60-css'

/** Fields printed on 80mm thermal payout receipts (72mm × ~40mm). */
export interface PayoutReceiptSlipFields {
  fightNumber: string
  bettingSide: string
  betAmount: string
  odds: string
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

/** Matches bet-slip thermal typography (72mm safe width, larger sharp text). */
export const PAYOUT_RECEIPT_SLIP_CSS = `
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
      max-height: 44mm;
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
    .cut {
      flex: 0 0 auto;
      margin: 0.35mm 0 0;
      padding-top: 0.5mm;
      border-top: 1px dashed #000;
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      letter-spacing: 0.04em;
      line-height: 1.1;
    }
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
        max-height: 44mm;
        overflow: visible;
      }
    }
`

export function buildPayoutReceiptSlipHtml(fields: PayoutReceiptSlipFields): string {
  const fightNumber = escapeHtml(fields.fightNumber)
  const bettingSide = escapeHtml(fields.bettingSide)
  const betAmount = escapeHtml(fields.betAmount)
  const odds = escapeHtml(fields.odds)
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
      <p class="line"><span class="label">Odds:</span> <span class="value">${odds}</span></p>
      <p class="line"><span class="label">Payout:</span> <span class="value emphasis">${payoutAmount}</span></p>
      <p class="line"><span class="label">Date &amp; time:</span> <span class="value">${paidAt}</span></p>
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
