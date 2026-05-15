import { useMutation, useQueryClient } from '@tanstack/react-query'

import { placeBet } from '@/lib/api-bets'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { invalidateAllFightQueries } from '@/lib/fight-query-keys'
import { invalidateTellerBetHistoryQueries } from '@/lib/teller-bets-query-keys'
import { randomUuid } from '@/lib/random-uuid'
import type { BetSideWire, PlaceBetRequest, PlaceBetResponse } from '@/types/api'

export interface PlaceBetVariables {
  fightId: string
  side: BetSideWire
  amount: number
}

/**
 * Idempotent-safe placement: a new UUID is generated for every call to
 * `mutate`, so accidental double-clicks create separate attempts (each
 * with its own idempotency key). Retries of the *same* in-flight request
 * are handled by TanStack + axios; for true network replay of one
 * logical bet, the caller would need to reuse an id (not required here).
 */
export function usePlaceBet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fightId, side, amount }: PlaceBetVariables): Promise<PlaceBetResponse> => {
      const body: PlaceBetRequest = {
        clientRequestId: randomUuid(),
        fightId,
        side,
        amount
      }
      return placeBet(body)
    },
    onSuccess: () => {
      void invalidateTellerBetHistoryQueries(queryClient)
      void invalidateAllFightQueries(queryClient)
      void queryClient.invalidateQueries({ queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX] })
    }
  })
}
