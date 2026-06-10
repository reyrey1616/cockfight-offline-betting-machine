/** 72mm wide slip on 80mm roll — height follows content (max ~52mm). */
export const THERMAL_SLIP_76X60_CSS = `
    @page { margin: 0; size: 72mm auto; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 72mm;
      max-width: 72mm;
      overflow: visible;
      font-family: system-ui, -apple-system, sans-serif;
      color: #000;
      background: #fff;
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
      gap: 0.75mm;
      overflow: visible;
    }
    .barcode-wrap {
      flex: 0 0 auto;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      min-height: 0;
      max-height: 18mm;
      padding: 0.5mm 0 0;
      overflow: visible;
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
      min-width: 0;
      overflow: hidden;
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
      font-size: 10px;
      line-height: 1.3;
      text-align: left;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .line + .line { margin-top: 0.75mm; }
    .label { font-weight: 700; }
    .value { font-size: 11px; font-weight: 600; }
    .emphasis { font-size: 13px; font-weight: 800; }
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

export function formatSlipTimestamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}
