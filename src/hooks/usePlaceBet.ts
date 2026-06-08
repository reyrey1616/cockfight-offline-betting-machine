import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { placeBet } from '@/lib/api-bets'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { invalidateAllFightQueries } from '@/lib/fight-query-keys'
import { useSetCashBalance } from '@/hooks/useCash'
import { invalidateTellerBetHistoryQueries } from '@/lib/teller-bets-query-keys'
import { printBetTicket } from '@/lib/print-bet-ticket'
import { randomUuid } from '@/lib/random-uuid'
import { useAuthUser } from '@/store/auth'
import type { BetSideWire, PlaceBetRequest, PlaceBetResponse } from '@/types/api'

export interface PlaceBetVariables {
  fightId: string
  side: BetSideWire
  amount: number
}

export interface UsePlaceBetOptions {
  /** Print thermal bet slip after a successful new bet (default true). */
  printTicket?: boolean
}

/**
 * Idempotent-safe placement: a new UUID is generated for every call to
 * `mutate`, so accidental double-clicks create separate attempts (each
 * with its own idempotency key). Retries of the *same* in-flight request
 * are handled by TanStack + axios; for true network replay of one
 * logical bet, the caller would need to reuse an id (not required here).
 *
 * On success (non-replay), prints an 80mm slip (Electron silent or browser dialog).
 */
export function usePlaceBet(options?: UsePlaceBetOptions) {
  const printTicket = options?.printTicket !== false
  const queryClient = useQueryClient()
  const setCashBalance = useSetCashBalance()
  const user = useAuthUser()

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
    onSuccess: async (data) => {
      setCashBalance(data.actorBalance)
      void invalidateTellerBetHistoryQueries(queryClient)
      void invalidateAllFightQueries(queryClient)
      void queryClient.invalidateQueries({ queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX] })

      if (!printTicket || data.replay) return

      // Electron: IPC returns immediately; print runs in main (see main.mjs).
      void printBetTicket({
        response: data,
        tellerName: user?.fullName
      }).then((printed) => {
        if (!printed && !window.electronAPI?.isElectron) {
          toast.error(
            'Could not open print window. Allow pop-ups or use the Electron kiosk app.'
          )
        }
      })
    }
  })
}
