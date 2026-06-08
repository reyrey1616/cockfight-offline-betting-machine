import JsBarcode from 'jsbarcode'

/** CODE128 PNG for 76×60mm bet slips — large bars. */
export function ticketCodeToBarcodeDataUrl(code: string): string {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, code, {
    format: 'CODE128',
    width: 2.5,
    height: 80,
    displayValue: false,
    margin: 2,
    background: '#ffffff'
  })
  return canvas.toDataURL('image/png')
}

/** CODE128 PNG for compact 76×40mm cash ADV/REM slips. */
export function cashSlipCodeToBarcodeDataUrl(code: string): string {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, code, {
    format: 'CODE128',
    width: 2.4,
    height: 52,
    displayValue: false,
    margin: 2,
    background: '#ffffff'
  })
  return canvas.toDataURL('image/png')
}
