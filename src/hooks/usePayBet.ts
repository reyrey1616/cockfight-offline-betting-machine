import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { payBet } from '@/lib/api-bets'
import { useSetCashBalance } from '@/hooks/useCash'
import { printPayoutReceipt } from '@/lib/print-payout-receipt'

export function usePayBet() {
  const setCashBalance = useSetCashBalance()

  return useMutation({
    mutationFn: (betId: string) => payBet(betId),
    onSuccess: async (data) => {
      setCashBalance(data.actorBalance)

      if (data.replay) return

      const printed = await printPayoutReceipt({
        bet: data.bet,
        fight: data.fight,
        paidAt: data.bet.paidAt
      })
      if (!printed) {
        toast.error(
          window.electronAPI?.isElectron
            ? 'Payout recorded but receipt did not print. Check printer name in desktop config.json.'
            : 'Payout recorded but receipt did not print. Allow pop-ups or use the Electron kiosk app.'
        )
      }
    }
  })
}
