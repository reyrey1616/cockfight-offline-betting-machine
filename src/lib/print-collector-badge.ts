import { buildCollectorBadgeSlipHtml } from '@/lib/collector-badge-slip-html'
import { ticketCodeToBarcodeDataUrl } from '@/lib/render-ticket-barcode'
import type { Collector } from '@/types/api'

export interface CollectorBadgePrintInput {
  collector: Collector
  /** Preview canvas PNG; generated from code when omitted. */
  barcodePngDataUrl?: string
}

function buildSlipFields(input: CollectorBadgePrintInput) {
  const { collector } = input
  return {
    name: collector.name,
    code: collector.code,
    barcodePngDataUrl:
      input.barcodePngDataUrl ?? ticketCodeToBarcodeDataUrl(collector.code)
  }
}

function printViaBrowserWindow(fields: ReturnType<typeof buildSlipFields>): boolean {
  const html = buildCollectorBadgeSlipHtml(fields)
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

/**
 * Print a collector badge (80mm thermal). Uses Electron silent print when available.
 */
export async function printCollectorBadge(input: CollectorBadgePrintInput): Promise<boolean> {
  const fields = buildSlipFields(input)
  const api = window.electronAPI
  if (api?.isElectron) {
    const result = await api.printCollectorBadge(fields)
    return result.ok
  }
  return printViaBrowserWindow(fields)
}
