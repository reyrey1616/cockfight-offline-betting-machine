import { FIGHT_STATUS_VALUE, type FightStatusValue } from '@/constants'
import type { BetSideWire } from '@/types/api'
import type { BetRow, Fight, FightOutcomeWire, PlaceBetFightSummary } from '@/types/api'

/** Rows always visible in the history column; extra rows scroll inside the viewport. */
export const FIGHT_BOARD_HISTORY_VISIBLE_ROWS = 6

/** Per-row height for the history viewport (matches py-2 row + result pill). */
export const FIGHT_BOARD_HISTORY_ROW_REM = 3

/** Max finished fights loaded into history (session list can scroll within the viewport). */
export const FIGHT_BOARD_HISTORY_FETCH_MAX = 120

/** Fixed height for the history list: 6 rows + gaps between them. */
export function fightBoardHistoryViewportHeight(): string {
  const n = FIGHT_BOARD_HISTORY_VISIBLE_ROWS
  const row = FIGHT_BOARD_HISTORY_ROW_REM
  return `calc(${n} * ${row}rem + ${n - 1} * 0.25rem)`
}

export function formatFightLabel(fightNumber: number | null | undefined): string {
  if (fightNumber == null) return '—'
  return `#${fightNumber}`
}

export interface FightBoardSessionStats {
  meronWins: number
  walaWins: number
  draws: number
  cancelled: number
}

export type FightBoardHistoryResult =
  | 'MERON'
  | 'WALA'
  | 'DRAW'
  | 'CANCELLED'

export interface FightBoardHistoryRow {
  fightNumber: number
  result: FightBoardHistoryResult
}

function isDrawLike(o: FightOutcomeWire): boolean {
  return o === 'DRAW'
}

/**
 * Tallies from the most recent `fights` page (descending `fightNumber`).
 * Not a server "session" boundary — good enough for LAN same-day boards.
 */
export function deriveSessionStats(fights: Fight[]): FightBoardSessionStats {
  let meronWins = 0
  let walaWins = 0
  let draws = 0
  let cancelled = 0

  for (const f of fights) {
    if (f.status === FIGHT_STATUS_VALUE.CANCELLED) {
      cancelled += 1
      continue
    }
    if (f.status !== FIGHT_STATUS_VALUE.SETTLED || !f.outcome) continue
    if (f.outcome === 'MERON') meronWins += 1
    else if (f.outcome === 'WALA') walaWins += 1
    else if (isDrawLike(f.outcome)) draws += 1
  }

  return { meronWins, walaWins, draws, cancelled }
}

/** Completed fights for the center column, newest first. */
export function deriveFightHistory(
  fights: Fight[],
  maxRows: number
): FightBoardHistoryRow[] {
  const rows: FightBoardHistoryRow[] = []

  const sorted = [...fights].sort((a, b) => b.fightNumber - a.fightNumber)

  for (const f of sorted) {
    if (rows.length >= maxRows) break
    if (f.status === FIGHT_STATUS_VALUE.CANCELLED) {
      rows.push({ fightNumber: f.fightNumber, result: 'CANCELLED' })
      continue
    }
    if (f.status !== FIGHT_STATUS_VALUE.SETTLED || !f.outcome) continue
    if (f.outcome === 'MERON' || f.outcome === 'WALA') {
      rows.push({ fightNumber: f.fightNumber, result: f.outcome })
    } else if (isDrawLike(f.outcome)) {
      rows.push({ fightNumber: f.fightNumber, result: 'DRAW' })
    } else if (f.outcome === 'CANCELLED') {
      rows.push({ fightNumber: f.fightNumber, result: 'CANCELLED' })
    }
  }

  return rows
}

/**
 * Payout odds display on the board / payout desk:
 * - multiply ratio by 100 (1.94257 → 194.257)
 * - floor the scaled value to 2 decimals (194.25)
 * - payout uses the matching multiplier (194.25 ÷ 100 = 1.9425)
 */

/** True when the fight is OPEN and admin has held a side (no new bets on that side). */
export function isSideHeld(
  fight: Pick<Fight, 'status' | 'meronAcceptingBets' | 'walaAcceptingBets'> | null,
  side: BetSideWire
): boolean {
  if (fight == null || (fight.status !== 'OPEN' && fight.status !== 'LAST_CALL')) return false
  return side === 'MERON' ? fight.meronAcceptingBets === false : fight.walaAcceptingBets === false
}

/** Effective payout multiplier after the scaled-odds floor rule. */
export function floorPayoutMultiplier(odds: number): number {
  return Math.floor(odds * 10000) / 10000
}

/** Scaled odds for display (×100, floored to 2 decimal places). */
export function scaledBoardOdds(odds: number): number {
  return Math.floor(odds * 10000) / 100
}

export function formatBoardOdds(odds: number | null): string {
  if (odds == null || !Number.isFinite(odds)) return '—'
  return scaledBoardOdds(odds).toFixed(2)
}

/** Payout amount for a stake using the floored payout multiplier. */
export function computePayoutFromOdds(stake: number, odds: number): number {
  const mult = floorPayoutMultiplier(odds)
  return Math.round(stake * mult * 100) / 100
}

/** Settled fight payout multiplier from API decimal string. */
export function parsePayoutRatio(raw: string | null | undefined): number | null {
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function settledOddsForSide(
  fight: Pick<PlaceBetFightSummary, 'payoutRatioMeron' | 'payoutRatioWala'>,
  side: 'MERON' | 'WALA'
): number | null {
  return parsePayoutRatio(
    side === 'MERON' ? fight.payoutRatioMeron : fight.payoutRatioWala
  )
}

/**
 * Odds for a payout receipt: settlement ratio when present, else payout ÷ stake
 * (matches the printed payout amount), else board odds.
 */
export function payoutReceiptOddsMultiplier(
  fight: PlaceBetFightSummary,
  bet: Pick<BetRow, 'side' | 'amount' | 'payoutAmount'>
): number | null {
  const settled = settledOddsForSide(fight, bet.side)
  if (settled != null) return settled

  const stake = Number(bet.amount)
  const payout = Number(bet.payoutAmount)
  if (Number.isFinite(stake) && stake > 0 && Number.isFinite(payout) && payout > 0) {
    return payout / stake
  }

  return boardOddsForSide(fight, bet.side)
}

/** Board / receipt odds string — scaled ×100 with 2 decimal places (1.9425 → "194.25"). */
export function formatPayoutReceiptOdds(
  fight: PlaceBetFightSummary,
  bet: Pick<BetRow, 'side' | 'amount' | 'payoutAmount'>
): string {
  return formatBoardOdds(payoutReceiptOddsMultiplier(fight, bet))
}

/**
 * Odds shown on the board for one side: live projection while betting is open,
 * frozen settlement payout ratio after the fight is SETTLED.
 */
export function boardOddsForSide(
  fight: Pick<
    Fight,
    'status' | 'meronOdds' | 'walaOdds' | 'payoutRatioMeron' | 'payoutRatioWala'
  > | null,
  side: 'MERON' | 'WALA'
): number | null {
  if (fight == null) return null
  if (fight.status === FIGHT_STATUS_VALUE.SETTLED) {
    return settledOddsForSide(fight, side)
  }
  return side === 'MERON' ? fight.meronOdds : fight.walaOdds
}

/**
 * Even-split pari-mutuel payout before any pool exists: 2 × (1 − commission/2).
 * At 15% commission → 1.85 → board display "185.00".
 */
export function defaultBoardOddsMultiplier(commissionRate: string | number): number {
  const c = Number(commissionRate)
  if (!Number.isFinite(c) || c < 0) return 2 * (1 - 0.15 / 2)
  return 2 * (1 - c / 2)
}

/** Live/settled odds when known; otherwise the commission-based default payout. */
export function resolveBoardOddsForSide(
  fight: Pick<
    Fight,
    'status' | 'meronOdds' | 'walaOdds' | 'payoutRatioMeron' | 'payoutRatioWala'
  > | null,
  side: 'MERON' | 'WALA',
  commissionRate: string | number
): number {
  return boardOddsForSide(fight, side) ?? defaultBoardOddsMultiplier(commissionRate)
}

export function buildFightBoardTicker(
  fight: Fight | null,
  fightNumberFallback: number | null
): string {
  const n = fight?.fightNumber ?? fightNumberFallback
  if (!fight || n == null) {
    return 'NO ACTIVE FIGHT — STANDBY.'
  }
  switch (fight.status as FightStatusValue) {
    case 'SCHEDULED':
      return `FIGHT #${n} — SCHEDULED. STANDBY UNTIL ADMIN OPENS BETTING.`
    case 'OPEN': {
      let msg = `FIGHT #${n} IS NOW OPEN. YOU MAY NOW PLACE YOUR BETS!!!`
      const meronHeld = isSideHeld(fight, 'MERON')
      const walaHeld = isSideHeld(fight, 'WALA')
      if (meronHeld && walaHeld) {
        msg += ' BOTH SIDES HELD — NO NEW BETS.'
      } else if (meronHeld) {
        msg += ' MERON HELD — NO NEW MERON BETS.'
      } else if (walaHeld) {
        msg += ' WALA HELD — NO NEW WALA BETS.'
      }
      return msg
    }
    case 'LAST_CALL': {
      let msg = `FIGHT #${n} LAST CALL. PLACE BETS NOW — CLOSING ANYTIME SOON.`
      const meronHeld = isSideHeld(fight, 'MERON')
      const walaHeld = isSideHeld(fight, 'WALA')
      if (meronHeld && walaHeld) {
        msg += ' BOTH SIDES HELD — NO NEW BETS.'
      } else if (meronHeld) {
        msg += ' MERON HELD — NO NEW MERON BETS.'
      } else if (walaHeld) {
        msg += ' WALA HELD — NO NEW WALA BETS.'
      }
      return msg
    }
    case 'CLOSED':
      return `FIGHT #${n} — BETTING CLOSED. AWAITING RESULT.`
    case 'SETTLED':
      return `FIGHT #${n} — RESULT: ${fight.outcome ?? 'SETTLED'}.`
    case 'CANCELLED':
      return `FIGHT #${n} — CANCELLED. BETS REFUNDED.`
    default:
      return `FIGHT #${n} — ${fight.status}.`
  }
}
