import { buildCashSlipHtml } from '@/lib/cash-slip-html'
import { hasElectronPrintBridge, warnIfBrowserPrintFallback } from '@/lib/electron-print-bridge'
import { formatMoney } from '@/lib/format-money'
import { cashSlipCodeToBarcodeDataUrl } from '@/lib/render-ticket-barcode'
import { formatSlipTimestamp } from '@/lib/thermal-slip-76x60-css'

export interface CashSlipPrintInput {
  kind: 'deposit' | 'remit'
  code: string
  amount: string | number
  collectorName: string
  tellerName: string
  recordedAt: string
  notes?: string
}

function buildSlipFields(input: CashSlipPrintInput) {
  const n = typeof input.amount === 'number' ? input.amount : Number(input.amount)
  const abs = Number.isFinite(n) ? Math.abs(n) : 0
  return {
    kind: input.kind,
    code: input.code,
    amount: formatMoney(String(abs.toFixed(2))),
    collectorName: input.collectorName,
    tellerName: input.tellerName,
    recordedAt: formatSlipTimestamp(input.recordedAt),
    notes: input.notes,
    barcodePngDataUrl: cashSlipCodeToBarcodeDataUrl(input.code)
  }
}

function printViaBrowserWindow(fields: ReturnType<typeof buildSlipFields>): boolean {
  const html = buildCashSlipHtml(fields)
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

/** Print ADV/REM receipt after teller cash transaction. */
export async function printCashSlip(input: CashSlipPrintInput): Promise<boolean> {
  if (!input.code?.trim()) return false
  const fields = buildSlipFields(input)
  const html = buildCashSlipHtml(fields)
  const api = window.electronAPI
  if (hasElectronPrintBridge() && api) {
    const result = await api.printCashSlip({ html })
    return result.ok
  }
  warnIfBrowserPrintFallback()
  return printViaBrowserWindow(fields)
}
