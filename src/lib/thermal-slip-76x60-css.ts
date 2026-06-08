/** Shared 76mm × 60mm thermal slip box on 80mm roll — bet ticket only. */
export const THERMAL_SLIP_76X60_CSS = `
    @page { margin: 0; size: 80mm auto; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 80mm;
      max-width: 80mm;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
      color: #000;
      background: #fff;
    }
    .slip {
      width: 76mm;
      max-width: 100%;
      height: 60mm;
      margin: 0 auto;
      border: 2px solid #000;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 1mm;
      overflow: hidden;
    }
    .barcode-wrap {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 0;
      max-height: 22mm;
      padding: 0.5mm 0;
      overflow: hidden;
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
      font-size: 8px;
      line-height: 1.3;
      text-align: left;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .line + .line { margin-top: 0.75mm; }
    .label { font-weight: 700; }
    .value { font-size: 9px; font-weight: 600; }
    .emphasis { font-size: 10px; font-weight: 800; }
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
`

export function formatSlipTimestamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}
