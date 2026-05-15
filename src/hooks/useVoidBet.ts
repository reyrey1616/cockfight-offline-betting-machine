import { useMutation, useQueryClient } from '@tanstack/react-query'

import { voidBet } from '@/lib/api-bets'
import { invalidateAllFightQueries } from '@/lib/fight-query-keys'
import { useSetCashBalance } from '@/hooks/useCash'
import { invalidateTellerBetHistoryQueries } from '@/lib/teller-bets-query-keys'
import type { VoidBetRequest } from '@/types/api'

export function useVoidBet() {
  const queryClient = useQueryClient()
  const setCashBalance = useSetCashBalance()

  return useMutation({
    mutationFn: ({ betId, body }: { betId: string; body?: VoidBetRequest }) =>
      voidBet(betId, body ?? {}),
    onSuccess: (data) => {
      setCashBalance(data.actorBalance)
      void invalidateTellerBetHistoryQueries(queryClient)
      void invalidateAllFightQueries(queryClient)
    }
  })
}
