/** Fields printed on 80mm thermal collector badges (XP-K200L and similar). */
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

/** Shared slip CSS — keep in sync with desktop `electron/print-collector-badge.mjs`. */
export const COLLECTOR_BADGE_SLIP_CSS = `
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
    .code-value {
      font-family: ui-monospace, monospace;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
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
    </div>
    <div class="meta">
      <p class="line"><span class="label">Collector:</span> <span class="value">${name}</span></p>
      <p class="line"><span class="label">Code:</span> <span class="value code-value">${code}</span></p>
    </div>
  </div>
</body>
</html>`
}
