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
      max-height: 54mm;
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
      padding: 0.25mm 0 0;
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
        max-height: 54mm;
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
