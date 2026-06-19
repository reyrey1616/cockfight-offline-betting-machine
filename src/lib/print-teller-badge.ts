import { hasElectronPrintBridge, warnIfBrowserPrintFallback } from '@/lib/electron-print-bridge'
import { credentialToBarcodeDataUrl } from '@/lib/render-ticket-barcode'
import { buildTellerBadgeSlipHtml } from '@/lib/teller-badge-slip-html'
import type { TellerLoginBarcodeResponse } from '@/types/api'

export interface TellerBadgePrintInput {
  teller: TellerLoginBarcodeResponse
  /** Preview canvas PNG; generated from barcodeValue when omitted. */
  barcodePngDataUrl?: string
}

function buildSlipFields(input: TellerBadgePrintInput) {
  const { teller } = input
  return {
    fullName: teller.fullName,
    username: teller.username,
    initials: teller.initials,
    barcodePngDataUrl:
      input.barcodePngDataUrl ?? credentialToBarcodeDataUrl(teller.barcodeValue)
  }
}

function printViaBrowserWindow(fields: ReturnType<typeof buildSlipFields>): boolean {
  const html = buildTellerBadgeSlipHtml(fields)
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

/** Print a teller login badge (80mm thermal). Uses Electron silent print when available. */
export async function printTellerBadge(input: TellerBadgePrintInput): Promise<boolean> {
  const fields = buildSlipFields(input)
  const html = buildTellerBadgeSlipHtml(fields)
  const api = window.electronAPI
  if (hasElectronPrintBridge() && api) {
    const result = await api.printCollectorBadge({ html })
    return result.ok
  }
  warnIfBrowserPrintFallback()
  return printViaBrowserWindow(fields)
}
