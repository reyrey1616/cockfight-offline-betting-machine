import { useCallback, useEffect, useRef, useState } from 'react'

import type { Fight } from '@/types/api'

export type FightWinnerFlash = {
  winner: 'MERON' | 'WALA'
  fightNumber: number
}

type Snapshot = { id: string; status: string; outcome: string | null }

const AUTO_DISMISS_MS = 3_000

export interface UseFightWinnerFlashOptions {
  /** When false, no overlay is shown (e.g. admin operate screen). Default true. */
  enabled?: boolean
}

/**
 * When the current fight becomes SETTLED with MERON or WALA (including
 * admin correction), exposes a one-shot flash for a full-screen overlay.
 * Skips the first paint (no flash on hydrate of an already-settled fight).
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

    if (fight.status !== 'SETTLED') {
      if (prev && prev.id !== fight.id) {
        dismissDeferred()
      } else if (
        prev &&
        prev.id === fight.id &&
        prev.status === 'SETTLED' &&
        (fight.status === 'OPEN' ||
          fight.status === 'LAST_CALL' ||
          fight.status === 'SCHEDULED' ||
          fight.status === 'CANCELLED')
      ) {
        dismissDeferred()
      }
      snapshotRef.current = next
      return
    }

    snapshotRef.current = next

    const o = fight.outcome
    if (o !== 'MERON' && o !== 'WALA') return
    if (!prev) return

    const sameFight = prev.id === fight.id
    const becameSettled = sameFight && prev.status !== 'SETTLED'
    const correction =
      sameFight &&
      prev.status === 'SETTLED' &&
      prev.outcome !== (fight.outcome ?? null) &&
      (o === 'MERON' || o === 'WALA')

    if (!becameSettled && !correction) return

    const dedupeKey = `${fight.id}:${o}:${fight.settledAt ?? fight.updatedAt}`
    if (flashKeyRef.current === dedupeKey) return
    flashKeyRef.current = dedupeKey

    setFlash({ winner: o, fightNumber: fight.fightNumber })
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
