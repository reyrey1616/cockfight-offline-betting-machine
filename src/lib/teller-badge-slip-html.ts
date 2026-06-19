/** Fields printed on 80mm thermal teller login badges. */
export interface TellerBadgeSlipFields {
  fullName: string
  username: string
  initials: string
  barcodePngDataUrl: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Matches collector badge thermal layout (72mm safe width). */
export const TELLER_BADGE_SLIP_CSS = `
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
      max-height: 40mm;
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
      max-height: 22mm;
      padding: 0.25mm 1mm 0;
      overflow: visible;
      gap: 0.25mm;
    }
    .barcode {
      display: block;
      width: 100%;
      max-width: 100%;
      max-height: 16mm;
      height: auto;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .barcode-hint {
      margin: 0;
      padding: 0;
      font-size: 8px;
      line-height: 1.1;
      text-align: center;
      letter-spacing: 0.02em;
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
    .mono {
      font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
      letter-spacing: 0.06em;
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
        max-height: 40mm;
        overflow: visible;
      }
    }
`

export function buildTellerBadgeSlipHtml(fields: TellerBadgeSlipFields): string {
  const fullName = escapeHtml(fields.fullName.trim() || '—')
  const username = escapeHtml(fields.username)
  const initials = escapeHtml(fields.initials)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${TELLER_BADGE_SLIP_CSS}
  </style>
</head>
<body>
  <div class="slip">
    <div class="barcode-wrap">
      <img class="barcode" src="${fields.barcodePngDataUrl}" alt="Teller login barcode" />
      <p class="barcode-hint">Scan for password · sign in as ${username}</p>
    </div>
    <div class="meta">
      <p class="line"><span class="label">Teller:</span> <span class="value">${fullName}</span></p>
      <p class="line mono"><span class="label">User:</span> ${username} · ${initials}</p>
    </div>
  </div>
</body>
</html>`
}
