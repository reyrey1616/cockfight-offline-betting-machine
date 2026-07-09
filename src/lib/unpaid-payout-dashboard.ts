import type { BetListRow } from '@/types/api'
import { UNPAID_PAYOUT_DASHBOARD_TTL_MS } from '@/constants'

export { UNPAID_PAYOUT_DASHBOARD_TTL_MS } from '@/constants'

/** Unpaid payout rows drop off the dashboard this long after fight settle/cancel. */
export function isVisibleOnUnpaidPayoutsDashboard(
  bet: BetListRow,
  nowMs = Date.now()
): boolean {
  if (!bet.fightEndedAt) return true
  const endedMs = new Date(bet.fightEndedAt).getTime()
  if (!Number.isFinite(endedMs)) return true
  return nowMs - endedMs < UNPAID_PAYOUT_DASHBOARD_TTL_MS
}

export function filterUnpaidPayoutsForDashboard(
  bets: BetListRow[],
  nowMs = Date.now()
): BetListRow[] {
  return bets.filter((bet) => isVisibleOnUnpaidPayoutsDashboard(bet, nowMs))
}

/** Teller archive: unpaid tickets aged off the admin dashboard after the configured window. */
export function isVisibleOnMyTellerUnpaidPayouts(
  bet: BetListRow,
  nowMs = Date.now()
): boolean {
  if (!bet.fightEndedAt) return false
  const endedMs = new Date(bet.fightEndedAt).getTime()
  if (!Number.isFinite(endedMs)) return false
  return nowMs - endedMs >= UNPAID_PAYOUT_DASHBOARD_TTL_MS
}

export function filterUnpaidPayoutsForMyTeller(
  bets: BetListRow[],
  nowMs = Date.now()
): BetListRow[] {
  return bets.filter((bet) => isVisibleOnMyTellerUnpaidPayouts(bet, nowMs))
}
