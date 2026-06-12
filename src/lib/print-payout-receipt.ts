import { BET_SIDE_LABEL } from '@/constants'
import { hasElectronPrintBridge, warnIfBrowserPrintFallback } from '@/lib/electron-print-bridge'
import {
  buildPayoutReceiptSlipHtml,
  formatSlipTimestamp
} from '@/lib/payout-receipt-slip-html'
import { formatBoardOdds, settledOddsForSide } from '@/lib/fight-board-derive'
import { formatMoney } from '@/lib/format-money'
import type { BetRow, PlaceBetFightSummary } from '@/types/api'

export interface PayoutReceiptPrintInput {
  bet: BetRow
  fight: PlaceBetFightSummary
  /** ISO timestamp from the server after pay; falls back to now. */
  paidAt?: string | null
}

function buildSlipFields(input: PayoutReceiptPrintInput) {
  const paidAtIso = input.paidAt ?? input.bet.paidAt ?? new Date().toISOString()
  const payout =
    input.bet.payoutAmount != null && input.bet.payoutAmount !== ''
      ? formatMoney(input.bet.payoutAmount)
      : '—'

  return {
    fightNumber: String(input.fight.fightNumber),
    bettingSide: BET_SIDE_LABEL[input.bet.side],
    tellerName: input.bet.tellerNameSnapshot ?? '—',
    betAmount: formatMoney(input.bet.amount),
    odds: formatBoardOdds(settledOddsForSide(input.fight, input.bet.side)),
    payoutAmount: payout,
    paidAt: formatSlipTimestamp(paidAtIso)
  }
}

function printViaBrowserWindow(fields: ReturnType<typeof buildSlipFields>): boolean {
  const html = buildPayoutReceiptSlipHtml(fields)
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

/** Print payout receipt after a winning ticket is marked paid. */
export async function printPayoutReceipt(input: PayoutReceiptPrintInput): Promise<boolean> {
  const fields = buildSlipFields(input)
  const html = buildPayoutReceiptSlipHtml(fields)
  const api = window.electronAPI
  if (hasElectronPrintBridge() && api) {
    const result = await api.printPayoutReceipt({ html })
    return result.ok
  }
  warnIfBrowserPrintFallback()
  return printViaBrowserWindow(fields)
}
