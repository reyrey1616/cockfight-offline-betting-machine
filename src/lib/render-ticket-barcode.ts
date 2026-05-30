import JsBarcode from 'jsbarcode'

/** CODE128 PNG for 80mm thermal — large bars to fill the slip square. */
export function ticketCodeToBarcodeDataUrl(code: string): string {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, code, {
    format: 'CODE128',
    width: 3.2,
    height: 96,
    displayValue: false,
    margin: 2,
    background: '#ffffff'
  })
  return canvas.toDataURL('image/png')
}
