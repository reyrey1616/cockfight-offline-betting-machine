import { api } from '@/lib/api'
import type {
  BetByCodeResponse,
  ListBetsQuery,
  ListBetsResponse,
  PayBetResponse,
  PlaceBetRequest,
  PlaceBetResponse,
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
