import type { BetRow, Fight } from '@/types/api'

export interface BetVoidEligibilityInput {
  bet: Pick<BetRow, 'status'>
  fight: Pick<Fight, 'status'> | null
}

export interface BetVoidEligibility {
  canVoid: boolean
  /** Shown on disabled cancel control or in confirm dialog when blocked. */
  blockReason: string | null
}

const FIGHT_STATUS_MESSAGES: Record<string, string> = {
  SCHEDULED: 'This fight is not open for betting yet.',
  CLOSED: 'Betting is closed. Tickets can only be cancelled while betting is still open.',
  SETTLED: 'This fight has been settled. Tickets can no longer be cancelled.',
  CANCELLED:
    'This fight was cancelled. Refunded tickets cannot be voided individually.'
}

const BET_STATUS_MESSAGES: Record<string, string> = {
  WON: 'Winning tickets cannot be cancelled.',
  LOST: 'Losing tickets cannot be cancelled.',
  PAID: 'Paid-out tickets cannot be cancelled.',
  REFUNDED: 'Refunded tickets cannot be cancelled.',
  VOIDED: 'This ticket is already voided.'
}

/**
 * Mirrors backend `evaluateBetVoidEligibility` — void only while fight is OPEN
 * and bet is PENDING. Side hold does not block voiding an existing ticket.
 */
export function getBetVoidEligibility({
  bet,
  fight
}: BetVoidEligibilityInput): BetVoidEligibility {
  if (!fight) {
    return {
      canVoid: false,
      blockReason: 'No active fight context for this ticket.'
    }
  }

  if (bet.status === 'VOIDED') {
    return { canVoid: false, blockReason: BET_STATUS_MESSAGES.VOIDED }
  }

  if (fight.status !== 'OPEN') {
    return {
      canVoid: false,
      blockReason:
        FIGHT_STATUS_MESSAGES[fight.status] ??
        'Tickets can only be cancelled while the fight is open for betting.'
    }
  }

  if (bet.status !== 'PENDING') {
    return {
      canVoid: false,
      blockReason:
        BET_STATUS_MESSAGES[bet.status] ?? 'Only pending tickets can be cancelled.'
    }
  }

  return { canVoid: true, blockReason: null }
}
