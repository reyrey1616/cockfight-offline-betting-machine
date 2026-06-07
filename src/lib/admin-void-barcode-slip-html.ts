/** Fields printed on 80mm thermal admin void authorization slips. */
export interface AdminVoidBarcodeSlipFields {
  username: string
  barcodePngDataUrl: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const ADMIN_VOID_BARCODE_SLIP_CSS = `
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
      margin: 0 auto;
      border: 2px solid #000;
      padding: 3mm;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 2mm;
    }
    .title {
      margin: 0;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .subtitle {
      margin: 0;
      font-size: 8px;
      line-height: 1.35;
      text-align: center;
    }
    .barcode-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1mm 0;
    }
    .barcode {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      object-fit: contain;
    }
    .meta {
      margin: 0;
      font-size: 9px;
      line-height: 1.35;
      text-align: center;
    }
    .label { font-weight: 700; }
`

export function buildAdminVoidBarcodeSlipHtml(fields: AdminVoidBarcodeSlipFields): string {
  const username = escapeHtml(fields.username.trim() || 'Admin')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${ADMIN_VOID_BARCODE_SLIP_CSS}
  </style>
</head>
<body>
  <div class="slip">
    <p class="title">Admin void authorization</p>
    <p class="subtitle">Scan at the teller kiosk to authorize ticket voids. Keep secure.</p>
    <div class="barcode-wrap">
      <img class="barcode" src="${fields.barcodePngDataUrl}" alt="Admin void barcode" />
    </div>
    <p class="meta"><span class="label">Admin:</span> ${username}</p>
  </div>
</body>
</html>`
}
