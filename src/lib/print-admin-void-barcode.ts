import { buildAdminVoidBarcodeSlipHtml } from '@/lib/admin-void-barcode-slip-html'
import { ticketCodeToBarcodeDataUrl } from '@/lib/render-ticket-barcode'

export interface AdminVoidBarcodePrintInput {
  username: string
  barcodeValue: string
  /** Preview canvas PNG; generated from barcodeValue when omitted. */
  barcodePngDataUrl?: string
}

function buildSlipFields(input: AdminVoidBarcodePrintInput) {
  return {
    username: input.username,
    barcodePngDataUrl:
      input.barcodePngDataUrl ?? ticketCodeToBarcodeDataUrl(input.barcodeValue)
  }
}

function printViaBrowserWindow(fields: ReturnType<typeof buildSlipFields>): boolean {
  const html = buildAdminVoidBarcodeSlipHtml(fields)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const blobUrl = URL.createObjectURL(blob)

  const w = window.open(blobUrl, '_blank', 'width=360,height=520')
  if (!w) {
    URL.revokeObjectURL(blobUrl)
    return false
  }

  const finish = () => {
    URL.revokeObjectURL(blobUrl)
    if (!w.closed) w.close()
  }

  w.addEventListener('load', () => {
    w.focus()
    window.setTimeout(() => {
      w.print()
      w.addEventListener('afterprint', finish, { once: true })
      window.setTimeout(finish, 4000)
    }, 250)
  })

  return true
}

/** Print admin void authorization barcode (80mm thermal layout). */
export async function printAdminVoidBarcode(input: AdminVoidBarcodePrintInput): Promise<boolean> {
  const fields = buildSlipFields(input)
  return printViaBrowserWindow(fields)
}
