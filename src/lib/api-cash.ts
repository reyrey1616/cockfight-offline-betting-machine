import { api } from '@/lib/api'
import type {
  CashAdvanceRequest,
  CashBalanceResponse,
  CashMutationResponse,
  CashRemitRequest,
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

/** POST /cash/advances — deposit from collector to teller drawer. */
export async function postCashAdvance(
  body: CashAdvanceRequest
): Promise<CashMutationResponse> {
  const { data } = await api.post<CashMutationResponse>('/cash/advances', body)
  return data
}

/** POST /cash/remits — remit cash from teller drawer to collector. */
export async function postCashRemit(body: CashRemitRequest): Promise<CashMutationResponse> {
  const { data } = await api.post<CashMutationResponse>('/cash/remits', body)
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
