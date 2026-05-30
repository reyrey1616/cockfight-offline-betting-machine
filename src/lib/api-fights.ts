import type { BetSideValue } from '@/constants'

import { api } from '@/lib/api'
import type {
  CancelFightRequest,
  CorrectFightRequest,
  CreateFightResponse,
  FightActionResponse,
  GetFightResponse,
  ListFightsQuery,
  ListFightsResponse,
  SettleFightRequest
} from '@/types/api'

function toQuery(params: ListFightsQuery): Record<string, string | number | boolean> {
  const q: Record<string, string | number | boolean> = {}
  if (params.status != null) q.status = params.status
  if (params.current != null) q.current = params.current
  if (params.limit != null) q.limit = params.limit
  if (params.cursor != null) q.cursor = params.cursor
  return q
}

/** GET /fights — bearer. */
export async function listFights(
  query: ListFightsQuery = {}
): Promise<ListFightsResponse> {
  const { data } = await api.get<ListFightsResponse>('/fights', {
    params: toQuery(query)
  })
  return data
}

/** GET /fights/:id — bearer. */
export async function getFight(id: string): Promise<GetFightResponse> {
  const { data } = await api.get<GetFightResponse>(`/fights/${id}`)
  return data
}

/** POST /fights — admin; creates fight already OPEN. */
export async function createFight(): Promise<CreateFightResponse> {
  const { data } = await api.post<CreateFightResponse>('/fights', {})
  return data
}

/** POST /fights/:id/close — admin. */
export async function closeFight(id: string): Promise<FightActionResponse> {
  const { data } = await api.post<FightActionResponse>(`/fights/${id}/close`)
  return data
}

/** POST /fights/:id/last-call — admin; OPEN → LAST_CALL. */
export async function setFightLastCall(id: string): Promise<FightActionResponse> {
  const { data } = await api.post<FightActionResponse>(`/fights/${id}/last-call`)
  return data
}

/** POST /fights/:id/resume-open — admin; LAST_CALL → OPEN. */
export async function resumeFightOpen(id: string): Promise<FightActionResponse> {
  const { data } = await api.post<FightActionResponse>(`/fights/${id}/resume-open`)
  return data
}

/** POST /fights/:id/reopen — admin; CLOSED → OPEN (undo mistaken close). */
export async function reopenFight(id: string): Promise<FightActionResponse> {
  const { data } = await api.post<FightActionResponse>(`/fights/${id}/reopen`)
  return data
}

/** POST /fights/:id/settle — admin. */
export async function settleFight(
  id: string,
  body: SettleFightRequest
): Promise<FightActionResponse> {
  const { data } = await api.post<FightActionResponse>(`/fights/${id}/settle`, body)
  return data
}

/** POST /fights/:id/cancel — admin. */
export async function cancelFight(
  id: string,
  body: CancelFightRequest = {}
): Promise<FightActionResponse> {
  const { data } = await api.post<FightActionResponse>(`/fights/${id}/cancel`, body)
  return data
}

/** POST /fights/:id/correct — admin. */
export async function correctFight(
  id: string,
  body: CorrectFightRequest
): Promise<FightActionResponse> {
  const { data } = await api.post<FightActionResponse>(`/fights/${id}/correct`, body)
  return data
}

/** POST /fights/:id/sides/:side/hold — admin. */
export async function holdFightSide(
  id: string,
  side: BetSideValue
): Promise<FightActionResponse> {
  const { data } = await api.post<FightActionResponse>(
    `/fights/${id}/sides/${side}/hold`
  )
  return data
}

/** POST /fights/:id/sides/:side/unhold — admin. */
export async function unholdFightSide(
  id: string,
  side: BetSideValue
): Promise<FightActionResponse> {
  const { data } = await api.post<FightActionResponse>(
    `/fights/${id}/sides/${side}/unhold`
  )
  return data
}
