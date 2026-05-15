import { api } from '@/lib/api'
import type {
  CashBalanceResponse,
  ListLedgerQuery,
  ListLedgerResponse
} from '@/types/api'

/** GET /cash/balance — own balance, or any teller when admin passes `tellerId`. */
export async function getCashBalance(
  tellerId?: string
): Promise<CashBalanceResponse> {
  const { data } = await api.get<CashBalanceResponse>('/cash/balance', {
    params: tellerId ? { tellerId } : undefined
  })
  return data
}

/** GET /cash/ledger — cursor list; admin may omit `tellerId` for system-wide. */
export async function listLedger(
  params?: ListLedgerQuery
): Promise<ListLedgerResponse> {
  const { data } = await api.get<ListLedgerResponse>('/cash/ledger', {
    params
  })
  return data
}
