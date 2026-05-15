import { api } from '@/lib/api'
import { SESSION_RESET_CONFIRM_TEXT } from '@/constants'
import type {
  ListSessionResetsQuery,
  ListSessionResetsResponse,
  ResetSessionRequest,
  ResetSessionResponse,
  SessionPreviewResponse,
} from '@/types/api'

/** GET /session/preview — row counts + pre-flight invariants (admin). */
export async function previewSessionReset(): Promise<SessionPreviewResponse> {
  const { data } = await api.get<SessionPreviewResponse>('/session/preview')
  return data
}

/** POST /session/reset — wipe fights, bets, ledger (admin, step-up password). */
export async function resetSession(
  body: Omit<ResetSessionRequest, 'confirm'> & { confirm?: string }
): Promise<ResetSessionResponse> {
  const { data } = await api.post<ResetSessionResponse>('/session/reset', {
    ...body,
    confirm: SESSION_RESET_CONFIRM_TEXT,
  })
  return data
}

/** GET /session/resets — audit log (admin). */
export async function listSessionResets(
  params?: ListSessionResetsQuery
): Promise<ListSessionResetsResponse> {
  const { data } = await api.get<ListSessionResetsResponse>('/session/resets', { params })
  return data
}
