import JsBarcode from 'jsbarcode'

/** CODE128 PNG for 76×60mm bet slips — large bars. */
export function ticketCodeToBarcodeDataUrl(code: string): string {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, code, {
    format: 'CODE128',
    width: 2.6,
    height: 64,
    displayValue: false,
    margin: 4,
    background: '#ffffff'
  })
  return canvas.toDataURL('image/png')
}

/** CODE128 PNG for collector badges — narrow bars so COL codes fit 72mm printable width. */
export function collectorCodeToBarcodeDataUrl(code: string): string {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, code, {
    format: 'CODE128',
    width: 2,
    height: 56,
    displayValue: false,
    margin: 4,
    background: '#ffffff'
  })
  return canvas.toDataURL('image/png')
}

/** CODE128 PNG for compact cash ADV/REM slips (72mm safe width). */
export function cashSlipCodeToBarcodeDataUrl(code: string): string {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, code, {
    format: 'CODE128',
    width: 2.2,
    height: 52,
    displayValue: false,
    margin: 4,
    background: '#ffffff'
  })
  return canvas.toDataURL('image/png')
}
