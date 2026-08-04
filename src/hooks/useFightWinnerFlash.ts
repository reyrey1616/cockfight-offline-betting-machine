import { useCallback, useEffect, useRef, useState } from 'react'

import type { Fight } from '@/types/api'

export type FightResultFlashOutcome = 'MERON' | 'WALA' | 'DRAW' | 'CANCELLED'

export type FightWinnerFlash = {
  outcome: FightResultFlashOutcome
  fightNumber: number
}

type Snapshot = { id: string; status: string; outcome: string | null }

const AUTO_DISMISS_MS = 3_000

export interface UseFightWinnerFlashOptions {
  /** When false, no overlay is shown (e.g. admin operate screen). Default true. */
  enabled?: boolean
}

function flashOutcomeForSnapshot(snapshot: Snapshot): FightResultFlashOutcome | null {
  if (snapshot.status === 'CANCELLED') return 'CANCELLED'
  if (snapshot.status !== 'SETTLED') return null
  if (
    snapshot.outcome === 'MERON' ||
    snapshot.outcome === 'WALA' ||
    snapshot.outcome === 'DRAW'
  ) {
    return snapshot.outcome
  }
  return null
}

/**
 * When the current fight is declared (MERON/WALA/DRAW settle or cancel),
 * exposes a one-shot flash for a full-screen overlay.
 * Skips the first paint (no flash on hydrate of an already-finished fight).
 */
export function useFightWinnerFlash(
  fight: Fight | null,
  options?: UseFightWinnerFlashOptions
): {
  flash: FightWinnerFlash | null
  dismiss: () => void
} {
  const enabled = options?.enabled !== false
  const [flash, setFlash] = useState<FightWinnerFlash | null>(null)
  const snapshotRef = useRef<Snapshot | null>(null)
  const flashKeyRef = useRef<string | null>(null)

  const dismiss = useCallback(() => {
    setFlash(null)
  }, [])

  const dismissDeferred = useCallback(() => {
    queueMicrotask(() => setFlash(null))
  }, [])

  useEffect(() => {
    if (!enabled) {
      dismissDeferred()
      snapshotRef.current = null
      return
    }

    if (!fight) {
      snapshotRef.current = null
      dismissDeferred()
      return
    }

    const prev = snapshotRef.current
    const next: Snapshot = {
      id: fight.id,
      status: fight.status,
      outcome: fight.outcome ?? null
    }
    const outcome = flashOutcomeForSnapshot(next)

    if (!outcome) {
      if (prev && prev.id !== fight.id) {
        dismissDeferred()
      } else if (
        prev &&
        prev.id === fight.id &&
        flashOutcomeForSnapshot(prev) &&
        (fight.status === 'OPEN' ||
          fight.status === 'LAST_CALL' ||
          fight.status === 'SCHEDULED' ||
          fight.status === 'CLOSED')
      ) {
        dismissDeferred()
      }
      snapshotRef.current = next
      return
    }

    snapshotRef.current = next
    if (!prev) return

    const sameFight = prev.id === fight.id
    if (!sameFight) return

    const prevOutcome = flashOutcomeForSnapshot(prev)
    const becameDeclared =
      prev.status !== fight.status ||
      prev.outcome !== next.outcome ||
      prevOutcome !== outcome

    if (!becameDeclared) return

    const dedupeKey = `${fight.id}:${outcome}:${fight.settledAt ?? fight.cancelledAt ?? fight.updatedAt}`
    if (flashKeyRef.current === dedupeKey) return
    flashKeyRef.current = dedupeKey

    setFlash({ outcome, fightNumber: fight.fightNumber })
  }, [fight, dismissDeferred, enabled])

  // Timer lives in its own effect: `fight` updates on every WS tick would
  // otherwise clear this timeout in the main effect cleanup before 3s elapses.
  useEffect(() => {
    if (!flash) return
    const tid = window.setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => window.clearTimeout(tid)
  }, [flash, dismiss])

  return { flash, dismiss }
}
