import { api } from '@/lib/api'
import type {
  BetByCodeResponse,
  ListBetsQuery,
  ListBetsResponse,
  PayBetResponse,
  PlaceBetRequest,
  PlaceBetResponse,
  VoidBetRequest,
  VoidBetResponse,
} from '@/types/api'

/** GET /bets — cursor list; admin may filter `tellerId`, tellers are server-scoped to self. */
export async function listBets(
  params?: ListBetsQuery
): Promise<ListBetsResponse> {
  const { data } = await api.get<ListBetsResponse>('/bets', { params })
  return data
}

export async function getBetByCode(code: string): Promise<BetByCodeResponse> {
  const { data } = await api.get<BetByCodeResponse>(
    `/bets/code/${encodeURIComponent(code)}`
  )
  return data
}

/** POST /bets/:id/pay — mark a winning ticket paid (teller at payout window). */
export async function payBet(betId: string): Promise<PayBetResponse> {
  const { data } = await api.post<PayBetResponse>(`/bets/${encodeURIComponent(betId)}/pay`)
  return data
}

/** POST /bets — teller placement; mint a fresh `clientRequestId` (UUID) per attempt. */
export async function placeBet(body: PlaceBetRequest): Promise<PlaceBetResponse> {
  const { data } = await api.post<PlaceBetResponse>('/bets', body)
  return data
}

/** POST /bets/:id/void — cancel a pending ticket (OPEN/LAST_CALL fight + admin barcode). */
export async function voidBet(
  betId: string,
  body: VoidBetRequest = {}
): Promise<VoidBetResponse> {
  const { data } = await api.post<VoidBetResponse>(
    `/bets/${encodeURIComponent(betId)}/void`,
    body
  )
  return data
}
