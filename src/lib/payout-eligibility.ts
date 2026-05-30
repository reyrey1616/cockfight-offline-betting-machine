import type { BetRow, PlaceBetFightSummary } from '@/types/api'

/** Winning ticket on a settled fight with a payout figure — ready to pay out. */
export function isPayableWin(bet: BetRow, fight: PlaceBetFightSummary): boolean {
  return (
    bet.status === 'WON' &&
    fight.status === 'SETTLED' &&
    bet.payoutAmount != null &&
    bet.payoutAmount !== ''
  )
}

/**
 * When the API returned a bet but it must not be paid from the payout desk,
 * map to cashier-facing modal copy.
 */
export function disqualificationMessage(
  bet: BetRow,
  fight: PlaceBetFightSummary
): string {
  if (fight.status === 'CANCELLED') {
    return 'This bet has been cancelled.'
  }
  if (fight.status === 'SETTLED' && bet.status === 'PENDING') {
    return 'This ticket is still pending — contact an admin (settlement data may be out of sync).'
  }
  if (fight.status !== 'SETTLED') {
    return 'This fight has not been settled yet.'
  }
  if (bet.status === 'VOIDED') {
    return 'This bet has been cancelled.'
  }
  if (bet.status === 'LOST') {
    return 'This bet did not win.'
  }
  if (
    bet.status === 'REFUNDED' &&
    fight.outcome === 'DRAW'
  ) {
    return 'This fight ended in a draw.'
  }
  if (bet.status === 'REFUNDED') {
    return 'This bet has been cancelled.'
  }
  if (bet.status === 'PAID') {
    return 'This winning ticket has already been paid out.'
  }
  if (bet.status === 'WON' && (bet.payoutAmount == null || bet.payoutAmount === '')) {
    return 'This winning ticket does not have a payout amount on record.'
  }
  if (bet.status === 'PENDING') {
    return 'This fight has not been settled yet.'
  }
  return 'This bet did not win.'
}
