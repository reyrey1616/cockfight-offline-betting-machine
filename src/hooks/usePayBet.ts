import { useMutation } from '@tanstack/react-query'

import { payBet } from '@/lib/api-bets'
import { useSetCashBalance } from '@/hooks/useCash'

export function usePayBet() {
  const setCashBalance = useSetCashBalance()

  return useMutation({
    mutationFn: (betId: string) => payBet(betId),
    onSuccess: (data) => {
      setCashBalance(data.actorBalance)
    }
  })
}
