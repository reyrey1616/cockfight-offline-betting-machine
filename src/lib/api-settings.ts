import { api } from '@/lib/api'
import type { GetSettingsResponse, UpdateSettingsRequest, UpdateSettingsResponse } from '@/types/api'

/** GET /settings — any authenticated user. Hook: `useSettings`. */
export async function getSettings(): Promise<GetSettingsResponse> {
  const { data } = await api.get<GetSettingsResponse>('/settings')
  return data
}

/** PATCH /settings — admin only. Hook: `useUpdateSettings`. */
export async function updateSettings(
  body: UpdateSettingsRequest
): Promise<UpdateSettingsResponse> {
  const { data } = await api.patch<UpdateSettingsResponse>('/settings', body)
  return data
}
