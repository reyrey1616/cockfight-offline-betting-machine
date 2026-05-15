import { api } from '@/lib/api'
import type {
  CreateCollectorRequest,
  CreateCollectorResponse,
  ListCollectorsQuery,
  ListCollectorsResponse,
  UpdateCollectorRequest,
  UpdateCollectorResponse
} from '@/types/api'

/** GET /collectors — list (optional filter). Hook: `useCollectorsList`. */
export async function listCollectors(
  params?: ListCollectorsQuery
): Promise<ListCollectorsResponse> {
  const { data } = await api.get<ListCollectorsResponse>('/collectors', { params })
  return data
}

/** POST /collectors — admin create. Hook: `useCreateCollector`. */
export async function createCollector(
  body: CreateCollectorRequest
): Promise<CreateCollectorResponse> {
  const { data } = await api.post<CreateCollectorResponse>('/collectors', body)
  return data
}

/** PATCH /collectors/:id — admin rename / retire / reactivate. Hook: `useUpdateCollector`. */
export async function updateCollector(
  id: string,
  body: UpdateCollectorRequest
): Promise<UpdateCollectorResponse> {
  const { data } = await api.patch<UpdateCollectorResponse>(`/collectors/${id}`, body)
  return data
}
