import type { QueryClient } from '@tanstack/react-query'

/** TanStack key prefix for teller-side `GET /bets` history on the live desk. */
export function tellerBetHistoryQueryKey(fightId: string | null) {
  return ['teller', 'bets', 'history', fightId ?? 'none'] as const
}

export function invalidateTellerBetHistoryQueries(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: ['teller', 'bets', 'history'] })
}
