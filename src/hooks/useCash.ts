import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getCashBalance, postCashAdvance, postCashRemit } from '@/lib/api-cash'
import { CASH_BALANCE_QUERY_KEY } from '@/lib/cash-query-keys'
import { useAuthToken, useAuthUser } from '@/store/auth'
import type { CashAdvanceRequest, CashRemitRequest } from '@/types/api'

export function useCashBalance() {
  const token = useAuthToken()
  const user = useAuthUser()

  return useQuery({
    queryKey: [...CASH_BALANCE_QUERY_KEY, user?.id],
    queryFn: () => getCashBalance(),
    enabled: Boolean(token && user),
    staleTime: 5_000
  })
}

export function useCashAdvance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CashAdvanceRequest) => postCashAdvance(body),
    onSuccess: (data) => {
      queryClient.setQueryData(
        [...CASH_BALANCE_QUERY_KEY, data.ledgerEntry.tellerId],
        (prev: { balance: string } | undefined) =>
          prev
            ? { ...prev, balance: data.actorBalance }
            : { balance: data.actorBalance }
      )
      void queryClient.invalidateQueries({ queryKey: CASH_BALANCE_QUERY_KEY })
    }
  })
}

export function useCashRemit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CashRemitRequest) => postCashRemit(body),
    onSuccess: (data) => {
      queryClient.setQueryData(
        [...CASH_BALANCE_QUERY_KEY, data.ledgerEntry.tellerId],
        (prev: { balance: string } | undefined) =>
          prev
            ? { ...prev, balance: data.actorBalance }
            : { balance: data.actorBalance }
      )
      void queryClient.invalidateQueries({ queryKey: CASH_BALANCE_QUERY_KEY })
    }
  })
}

/** Call after bet place / pay when HTTP returns `actorBalance`. */
export function useSetCashBalance() {
  const queryClient = useQueryClient()
  const user = useAuthUser()

  return (balance: string) => {
    if (!user) return
    queryClient.setQueryData([...CASH_BALANCE_QUERY_KEY, user.id], (prev: unknown) => {
      const base =
        prev && typeof prev === 'object' && 'balance' in prev
          ? (prev as { balance: string; tellerId?: string; username?: string; fullName?: string })
          : { tellerId: user.id, username: user.username, fullName: user.fullName, balance }
      return { ...base, balance }
    })
  }
}
