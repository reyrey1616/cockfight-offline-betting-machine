import { FIGHT_STATUS_VALUE, type FightStatusValue } from '@/constants'
import type { Fight, FightOutcomeWire, PlaceBetFightSummary } from '@/types/api'

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
  | 'NO_CONTEST'
  | 'CANCELLED'

export interface FightBoardHistoryRow {
  fightNumber: number
  result: FightBoardHistoryResult
}

function isDrawLike(o: FightOutcomeWire): boolean {
  return o === 'DRAW' || o === 'NO_CONTEST'
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

export function oddsToLegacyBoardInt(odds: number | null): string {
  if (odds == null) return '—'
  return String(Math.round(odds * 100))
}

/**
 * Live parimutuel multiplier on the fight board — two fractional digits,
 * aligned with `computeLiveOdds` (API + client) and common retail display.
 */
export function formatBoardOdds(odds: number | null): string {
  if (odds == null || !Number.isFinite(odds)) return '—'
  return odds.toFixed(2)
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
      const meronHeld = !fight.meronAcceptingBets
      const walaHeld = !fight.walaAcceptingBets
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
