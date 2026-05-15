import { api } from '@/lib/api'
import type { TellerCommissionsResponse } from '@/types/api'

/** `GET /reports/teller-commissions` — admin; per-teller realized commission. */
export async function getTellerCommissions(): Promise<TellerCommissionsResponse> {
  const { data } = await api.get<TellerCommissionsResponse>('/reports/teller-commissions')
  return data
}
