import type { FightStatusValue } from '@/constants'

import { computeLiveOdds } from '@/lib/compute-live-odds'
import type { Fight, FightOutcomeWire, FightWelcomeSnapshot } from '@/types/api'

/**
 * Fight to show on the board / live desk. API lists `current` fights by
 * fightNumber desc — take the newest row that is still meaningful to display
 * (not cancelled / legacy scheduled).
 */
export function pickCurrentDisplayFight(
  fights: Fight[] | undefined
): Fight | undefined {
  if (!fights?.length) return undefined
  const eligible = fights.filter(
    (f) => f.status !== 'CANCELLED' && f.status !== 'SCHEDULED'
  )
  return eligible[0] ?? fights[0]
}

/** `WELCOME.data.currentFight` — synthesize a full `Fight` for UI + merges. */
export function welcomeSnapshotToFight(
  s: FightWelcomeSnapshot,
  tsIso: string
): Fight {
  return {
    id: s.id,
    fightNumber: s.fightNumber,
    status: s.status,
    commissionRate: s.commissionRate,
    meronPool: s.meronPool,
    walaPool: s.walaPool,
    meronOdds: s.meronOdds,
    walaOdds: s.walaOdds,
    meronAcceptingBets: s.meronAcceptingBets,
    walaAcceptingBets: s.walaAcceptingBets,
    outcome: s.outcome,
    payoutRatioMeron: s.payoutRatioMeron,
    payoutRatioWala: s.payoutRatioWala,
    meronHeldAt: null,
    meronHeldByUserId: null,
    walaHeldAt: null,
    walaHeldByUserId: null,
    openedAt: null,
    closedAt: null,
    settledAt: null,
    cancelledAt: null,
    previousOutcome: null,
    previousPayoutRatioMeron: null,
    previousPayoutRatioWala: null,
    correctedAt: null,
    correctedByUserId: null,
    correctionReason: null,
    createdAt: tsIso,
    updatedAt: tsIso
  }
}

function frameFightId(data: Record<string, unknown>): string | undefined {
  const a = data.fightId
  const b = data.id
  if (typeof a === 'string') return a
  if (typeof b === 'string') return b
  return undefined
}

function asOutcome(v: unknown): FightOutcomeWire | null {
  if (v == null) return null
  if (typeof v !== 'string') return null
  if (
    v === 'MERON' ||
    v === 'WALA' ||
    v === 'DRAW' ||
    v === 'CANCELLED'
  ) {
    return v
  }
  return null
}

function asStatus(v: unknown): FightStatusValue | undefined {
  if (typeof v !== 'string') return undefined
  if (
    v === 'SCHEDULED' ||
    v === 'OPEN' ||
    v === 'LAST_CALL' ||
    v === 'CLOSED' ||
    v === 'SETTLED' ||
    v === 'CANCELLED'
  ) {
    return v
  }
  return undefined
}

/** `ODDS_UPDATE.data` — pools + odds already computed on the server. */
export function mergeOddsUpdate(
  fight: Fight,
  data: {
    fightId: string
    meronPool: string
    walaPool: string
    meronOdds: number | null
    walaOdds: number | null
  }
): Fight | null {
  if (fight.id !== data.fightId) return null
  return {
    ...fight,
    meronPool: data.meronPool,
    walaPool: data.walaPool,
    meronOdds: data.meronOdds,
    walaOdds: data.walaOdds,
    updatedAt: new Date().toISOString()
  }
}

/**
 * `FIGHT_OPENED` / `FIGHT_CLOSED` / `FIGHT_SETTLED` / `FIGHT_CANCELLED` —
 * `fightProjection` payloads use `fightId` (not `id`).
 */
export function mergeFightLifecycleProjection(
  fight: Fight,
  data: Record<string, unknown>
): Fight | null {
  const id = frameFightId(data)
  if (!id || fight.id !== id) return null

  const next: Fight = { ...fight }
  const st = asStatus(data.status)
  if (st) next.status = st
  if (typeof data.fightNumber === 'number') next.fightNumber = data.fightNumber
  if (data.meronPool != null) next.meronPool = String(data.meronPool)
  if (data.walaPool != null) next.walaPool = String(data.walaPool)
  if (typeof data.meronAcceptingBets === 'boolean') {
    next.meronAcceptingBets = data.meronAcceptingBets
  }
  if (typeof data.walaAcceptingBets === 'boolean') {
    next.walaAcceptingBets = data.walaAcceptingBets
  }

  const oc = asOutcome(data.outcome)
  if ('outcome' in data) next.outcome = oc

  if (data.payoutRatioMeron !== undefined) {
    next.payoutRatioMeron =
      data.payoutRatioMeron == null ? null : String(data.payoutRatioMeron)
  }
  if (data.payoutRatioWala !== undefined) {
    next.payoutRatioWala =
      data.payoutRatioWala == null ? null : String(data.payoutRatioWala)
  }

  const computed = computeLiveOdds(next)
  if (typeof data.meronOdds === 'number' || data.meronOdds === null) {
    next.meronOdds = data.meronOdds as number | null
  } else {
    next.meronOdds = computed.meronOdds
  }
  if (typeof data.walaOdds === 'number' || data.walaOdds === null) {
    next.walaOdds = data.walaOdds as number | null
  } else {
    next.walaOdds = computed.walaOdds
  }

  next.updatedAt = new Date().toISOString()
  return next
}

/** `FIGHT_CORRECTED` — carries audit + new outcome fields. */
export function mergeFightCorrected(
  fight: Fight,
  data: Record<string, unknown>
): Fight | null {
  const merged = mergeFightLifecycleProjection(fight, data)
  if (!merged) return null

  if ('previousOutcome' in data) {
    merged.previousOutcome = asOutcome(data.previousOutcome)
  }
  if (data.previousPayoutRatioMeron !== undefined) {
    merged.previousPayoutRatioMeron =
      data.previousPayoutRatioMeron == null
        ? null
        : String(data.previousPayoutRatioMeron)
  }
  if (data.previousPayoutRatioWala !== undefined) {
    merged.previousPayoutRatioWala =
      data.previousPayoutRatioWala == null
        ? null
        : String(data.previousPayoutRatioWala)
  }
  if (data.correctedAt !== undefined) {
    merged.correctedAt =
      typeof data.correctedAt === 'string' ? data.correctedAt : null
  }
  if (data.correctedByUserId !== undefined) {
    merged.correctedByUserId =
      typeof data.correctedByUserId === 'string' ? data.correctedByUserId : null
  }
  if (data.correctionReason !== undefined) {
    merged.correctionReason =
      typeof data.correctionReason === 'string' ? data.correctionReason : null
  }

  return merged
}

/** `SIDE_HELD` / `SIDE_UNHELD` — `accepting: { meron, wala }` */
export function mergeSideAcceptingFrame(
  fight: Fight,
  data: {
    fightId: string
    accepting: { meron: boolean; wala: boolean }
  }
): Fight | null {
  if (fight.id !== data.fightId) return null
  return {
    ...fight,
    meronAcceptingBets: data.accepting.meron,
    walaAcceptingBets: data.accepting.wala,
    updatedAt: new Date().toISOString()
  }
}
