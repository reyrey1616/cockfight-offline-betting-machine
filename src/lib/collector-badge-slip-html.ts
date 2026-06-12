/** Fields printed on 80mm thermal collector badges. */
export interface CollectorBadgeSlipFields {
  name: string
  code: string
  barcodePngDataUrl: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Matches bet-slip thermal layout (72mm safe width, compact barcode). */
export const COLLECTOR_BADGE_SLIP_CSS = `
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
      max-height: 36mm;
      margin: 0;
      border: 2px solid #000;
      padding: 1.5mm 1.5mm 1mm;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 0.5mm;
      overflow: visible;
    }
    .barcode-wrap {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 0;
      max-height: 20mm;
      padding: 0.25mm 1mm 0;
      overflow: visible;
      gap: 0.25mm;
    }
    .barcode {
      display: block;
      width: 100%;
      max-width: 100%;
      max-height: 14mm;
      height: auto;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .barcode-code {
      margin: 0;
      padding: 0;
      font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
      font-size: 13px;
      font-weight: 800;
      line-height: 1;
      letter-spacing: 0.1em;
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
      text-align: center;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .label { font-weight: 800; }
    .value { font-size: 13px; font-weight: 700; }
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
        max-height: 36mm;
        overflow: visible;
      }
    }
`

export function buildCollectorBadgeSlipHtml(fields: CollectorBadgeSlipFields): string {
  const name = escapeHtml(fields.name.trim() || '—')
  const code = escapeHtml(fields.code)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${COLLECTOR_BADGE_SLIP_CSS}
  </style>
</head>
<body>
  <div class="slip">
    <div class="barcode-wrap">
      <img class="barcode" src="${fields.barcodePngDataUrl}" alt="${code}" />
      <p class="barcode-code">${code}</p>
    </div>
    <div class="meta">
      <p class="line"><span class="label">Collector:</span> <span class="value">${name}</span></p>
    </div>
  </div>
</body>
</html>`
}
