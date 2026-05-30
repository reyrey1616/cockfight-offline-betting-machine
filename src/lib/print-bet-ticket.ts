import { buildBetTicketSlipHtml } from '@/lib/bet-ticket-slip-html'
import { formatMoney } from '@/lib/format-money'
import { ticketCodeToBarcodeDataUrl } from '@/lib/render-ticket-barcode'
import type { PlaceBetResponse } from '@/types/api'

export interface BetTicketPrintInput {
  response: PlaceBetResponse
  tellerName?: string | null
}

function buildSlipFields(input: BetTicketPrintInput) {
  const { bet } = input.response
  return {
    code: bet.code,
    amount: formatMoney(bet.amount),
    tellerName: input.tellerName ?? bet.tellerNameSnapshot ?? '—',
    barcodePngDataUrl: ticketCodeToBarcodeDataUrl(bet.code)
  }
}

/**
 * Browser fallback: load slip HTML via blob URL (document.write on about:blank
 * is blocked when noopener is set and is unreliable in modern Chrome).
 */
function printViaBrowserWindow(fields: ReturnType<typeof buildSlipFields>): boolean {
  const html = buildBetTicketSlipHtml(fields)
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
    // Let the barcode image decode before print.
    window.setTimeout(() => {
      w.print()
      w.addEventListener('afterprint', finish, { once: true })
      window.setTimeout(finish, 4000)
    }, 250)
  })

  return true
}

/**
 * Print a bet slip after placement. Uses Electron silent print when available.
 */
export async function printBetTicket(input: BetTicketPrintInput): Promise<boolean> {
  const fields = buildSlipFields(input)
  const api = window.electronAPI
  if (api?.isElectron) {
    const result = await api.printBetTicket(fields)
    return result.ok
  }
  return printViaBrowserWindow(fields)
}
