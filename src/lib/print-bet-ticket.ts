import { buildBetTicketSlipHtml } from '@/lib/bet-ticket-slip-html'
import { BET_SIDE_LABEL } from '@/constants'
import { formatMoney } from '@/lib/format-money'
import { formatSlipTimestamp } from '@/lib/thermal-slip-76x60-css'
import { ticketCodeToBarcodeDataUrl } from '@/lib/render-ticket-barcode'
import type { BetRow, Fight, PlaceBetFightSummary, PlaceBetResponse } from '@/types/api'

export interface BetTicketPrintInput {
  response: PlaceBetResponse
  tellerName?: string | null
}

export interface BetTicketReprintInput {
  bet: BetRow
  fightNumber: number
  tellerName?: string | null
}

function buildSlipFieldsFromBet(
  bet: Pick<BetRow, 'code' | 'side' | 'amount' | 'createdAt' | 'tellerNameSnapshot'>,
  fightNumber: number,
  tellerName?: string | null
) {
  return {
    code: bet.code,
    fightNumber: String(fightNumber),
    bettingSide: BET_SIDE_LABEL[bet.side],
    betAmount: formatMoney(bet.amount),
    tellerName: tellerName ?? bet.tellerNameSnapshot ?? '—',
    placedAt: formatSlipTimestamp(bet.createdAt),
    barcodePngDataUrl: ticketCodeToBarcodeDataUrl(bet.code)
  }
}

function buildSlipFields(input: BetTicketPrintInput) {
  const { bet, fight } = input.response
  return buildSlipFieldsFromBet(bet, fight.fightNumber, input.tellerName)
}

async function sendSlipToPrinter(fields: ReturnType<typeof buildSlipFieldsFromBet>): Promise<boolean> {
  const api = window.electronAPI
  if (api?.isElectron) {
    const result = await api.printBetTicket(fields)
    return result.ok
  }
  return printViaBrowserWindow(fields)
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
  return sendSlipToPrinter(buildSlipFields(input))
}

/** Reprint a slip from betting history (same layout as original placement). */
export async function reprintBetTicket(input: BetTicketReprintInput): Promise<boolean> {
  return sendSlipToPrinter(
    buildSlipFieldsFromBet(input.bet, input.fightNumber, input.tellerName)
  )
}
