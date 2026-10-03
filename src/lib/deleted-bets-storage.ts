// Record of bets purged via `/bets`, shown on `/bets1`.
//
// localStorage only — per PC/browser; survives reloads. Cleared on session reset
// (this browser), and `/bets1` prunes records whose fight no longer exists
// (session reset done from another PC).

import type { BetSideWire, PurgeBetResponse } from '@/types/api'

const DELETED_BETS_KEY = 'deletedBets'

export interface DeletedBetRecord {
  betId: string
  code: string
  /** Missing on records saved before session-reset pruning existed. */
  fightId?: string
  fightNumber: number
  tellerId: string
  tellerName: string | null
  side: BetSideWire
  amount: string
  commissionRate: string
  /** Teller commission removed from the dashboard (stake × rate / 2). */
  commissionDrop: string
  deletedAt: string
}

export function readDeletedBets(): DeletedBetRecord[] {
  try {
    const raw = localStorage.getItem(DELETED_BETS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as DeletedBetRecord[]) : []
  } catch {
    return []
  }
}

function writeDeletedBets(records: DeletedBetRecord[]): void {
  try {
    localStorage.setItem(DELETED_BETS_KEY, JSON.stringify(records))
  } catch {
    /* storage unavailable or full */
  }
}

export function recordDeletedBet(res: PurgeBetResponse, tellerName?: string | null): void {
  const record: DeletedBetRecord = {
    betId: res.purged.betId,
    code: res.purged.code,
    fightId: res.purged.fightId,
    fightNumber: res.purged.fightNumber,
    tellerId: res.purged.tellerId,
    tellerName: res.purged.tellerNameSnapshot ?? tellerName ?? null,
    side: res.purged.side,
    amount: res.purged.amount,
    commissionRate: res.purged.commissionRate,
    commissionDrop: res.impact.dashboardCommissionDrop,
    deletedAt: new Date().toISOString()
  }
  writeDeletedBets([record, ...readDeletedBets().filter((b) => b.betId !== record.betId)])
}

export function clearDeletedBets(): void {
  try {
    localStorage.removeItem(DELETED_BETS_KEY)
  } catch {
    /* storage unavailable */
  }
}

/**
 * Drop records from a previous session: their fight was wiped by a session reset.
 * Old records without `fightId` are dropped when no current fight has their number
 * (fight numbers restart at #1 after a reset).
 */
export function pruneDeletedBetsToFights(
  fights: ReadonlyArray<{ id: string; fightNumber: number }>
): DeletedBetRecord[] {
  const fightIds = new Set(fights.map((f) => f.id))
  const fightNumbers = new Set(fights.map((f) => f.fightNumber))
  const current = readDeletedBets()
  const kept = current.filter((b) =>
    b.fightId ? fightIds.has(b.fightId) : fightNumbers.has(b.fightNumber)
  )
  if (kept.length !== current.length) writeDeletedBets(kept)
  return kept
}
