import { api } from '@/lib/api'
import type { FightCommissionsResponse, TellerCommissionsResponse } from '@/types/api'

/** `GET /reports/teller-commissions` — admin; per-teller realized commission. */
export async function getTellerCommissions(): Promise<TellerCommissionsResponse> {
  const { data } = await api.get<TellerCommissionsResponse>('/reports/teller-commissions')
  return data
}

/** `GET /reports/fight-commissions` — admin; per-fight house commission. */
export async function getFightCommissions(): Promise<FightCommissionsResponse> {
  const { data } = await api.get<FightCommissionsResponse>('/reports/fight-commissions')
  return data
}
