/**
 * Domain copy + wire enums for the betting kiosk UI.
 *
 * **Wire values** (`…_VALUE` / `…_VALUES`) must stay identical to Prisma /
 * Fastify JSON enums in `cockfigh-offline-betting-api` — change the API
 * first, then update this file.
 *
 * **Labels** are English UI strings only; safe to tune for tone / locale
 * without touching the backend.
 */

// ---------------------------------------------------------------------------
// Product copy (shared chrome)
// ---------------------------------------------------------------------------

export const BRANDING = {
  APP_NAME: 'Cockfight Betting',
  /** Login card subtitle */
  LOGIN_KIOSK_TAGLINE: 'Cockfight betting kiosk — admin or teller account'
} as const

// ---------------------------------------------------------------------------
// Bet side — `BetSide` in Prisma (`Bet.side`, WebSocket pool keys, etc.)
// ---------------------------------------------------------------------------

export const BET_SIDE_VALUE = {
  MERON: 'MERON',
  WALA: 'WALA'
} as const

export type BetSideValue = (typeof BET_SIDE_VALUE)[keyof typeof BET_SIDE_VALUE]

export const BET_SIDE_VALUES = Object.values(BET_SIDE_VALUE) as BetSideValue[]

/** Short labels for tickets / pool columns */
export const BET_SIDE_LABEL: Record<BetSideValue, string> = {
  MERON: 'Meron',
  WALA: 'Wala'
}

/** Longer copy for help text / empty states */
export const BET_SIDE_DESCRIPTION: Record<BetSideValue, string> = {
  MERON: 'Favorite / red corner (traditionally higher pool side).',
  WALA: 'Underdog / blue corner.'
}

// ---------------------------------------------------------------------------
// Bet status — `BetStatus` in Prisma
// ---------------------------------------------------------------------------

export const BET_STATUS_VALUE = {
  PENDING: 'PENDING',
  WON: 'WON',
  LOST: 'LOST',
  PAID: 'PAID',
  VOIDED: 'VOIDED',
  REFUNDED: 'REFUNDED'
} as const

export type BetStatusValue =
  (typeof BET_STATUS_VALUE)[keyof typeof BET_STATUS_VALUE]

export const BET_STATUS_VALUES = Object.values(
  BET_STATUS_VALUE
) as BetStatusValue[]

export const BET_STATUS_LABEL: Record<BetStatusValue, string> = {
  PENDING: 'Pending',
  WON: 'Won',
  LOST: 'Lost',
  PAID: 'Paid out',
  VOIDED: 'Voided',
  REFUNDED: 'Refunded'
}

// ---------------------------------------------------------------------------
// Fight lifecycle — `FightStatus` in Prisma
// ---------------------------------------------------------------------------

export const FIGHT_STATUS_VALUE = {
  SCHEDULED: 'SCHEDULED',
  OPEN: 'OPEN',
  LAST_CALL: 'LAST_CALL',
  CLOSED: 'CLOSED',
  SETTLED: 'SETTLED',
  CANCELLED: 'CANCELLED'
} as const

export type FightStatusValue =
  (typeof FIGHT_STATUS_VALUE)[keyof typeof FIGHT_STATUS_VALUE]

export const FIGHT_STATUS_VALUES = Object.values(
  FIGHT_STATUS_VALUE
) as FightStatusValue[]

export const FIGHT_STATUS_LABEL: Record<FightStatusValue, string> = {
  SCHEDULED: 'Scheduled',
  OPEN: 'Open — accepting bets',
  LAST_CALL: 'Last call — closing soon',
  CLOSED: 'Closed — awaiting result',
  SETTLED: 'Settled',
  CANCELLED: 'Cancelled'
}

// ---------------------------------------------------------------------------
// Fight result — `FightOutcome` in Prisma (settlement winner / refund reason)
// ---------------------------------------------------------------------------

export const FIGHT_OUTCOME_VALUE = {
  MERON: 'MERON',
  WALA: 'WALA',
  DRAW: 'DRAW',
  CANCELLED: 'CANCELLED'
} as const

export type FightOutcomeValue =
  (typeof FIGHT_OUTCOME_VALUE)[keyof typeof FIGHT_OUTCOME_VALUE]

export const FIGHT_OUTCOME_VALUES = Object.values(
  FIGHT_OUTCOME_VALUE
) as FightOutcomeValue[]

export const FIGHT_OUTCOME_LABEL: Record<FightOutcomeValue, string> = {
  MERON: 'Meron wins',
  WALA: 'Wala wins',
  DRAW: 'Draw — refunds',
  CANCELLED: 'Cancelled — refunds'
}

// ---------------------------------------------------------------------------
// User role — matches `UserRole` / JWT (`TELLER` | `ADMIN`)
// ---------------------------------------------------------------------------

export const USER_ROLE_VALUE = {
  TELLER: 'TELLER',
  ADMIN: 'ADMIN'
} as const

export type UserRoleValue =
  (typeof USER_ROLE_VALUE)[keyof typeof USER_ROLE_VALUE]

export const USER_ROLE_LABEL: Record<UserRoleValue, string> = {
  TELLER: 'Teller',
  ADMIN: 'Admin'
}

// ---------------------------------------------------------------------------
// Teller ledger row type — `TellerLedgerEntryType` in Prisma (cash UI)
// ---------------------------------------------------------------------------

export const LEDGER_ENTRY_TYPE_VALUE = {
  CASH_ADVANCE: 'CASH_ADVANCE',
  BET_PLACED: 'BET_PLACED',
  BET_VOIDED: 'BET_VOIDED',
  BET_REFUNDED: 'BET_REFUNDED',
  PAYOUT: 'PAYOUT',
  REMIT: 'REMIT',
  ADJUSTMENT: 'ADJUSTMENT'
} as const

export type LedgerEntryTypeValue =
  (typeof LEDGER_ENTRY_TYPE_VALUE)[keyof typeof LEDGER_ENTRY_TYPE_VALUE]

export const LEDGER_ENTRY_TYPE_LABEL: Record<LedgerEntryTypeValue, string> = {
  CASH_ADVANCE: 'Cash advance',
  BET_PLACED: 'Bet placed',
  BET_VOIDED: 'Bet voided',
  BET_REFUNDED: 'Bet refunded',
  PAYOUT: 'Payout',
  REMIT: 'Remit',
  ADJUSTMENT: 'Adjustment'
}

// ---------------------------------------------------------------------------
// Session reset (magic string body) — single source for UI + future forms
// ---------------------------------------------------------------------------

export const SESSION_RESET_CONFIRM_TEXT = 'WIPE-SESSION' as const
