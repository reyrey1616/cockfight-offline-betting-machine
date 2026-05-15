import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { DASHBOARD_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { listSessionResets, previewSessionReset, resetSession } from '@/lib/api-session'
import { FIGHTS_QUERY_PREFIX } from '@/lib/fight-query-keys'
import type { ResetSessionRequest } from '@/types/api'

export const sessionPreviewQueryKey = ['session', 'preview'] as const
export const sessionResetsQueryKey = ['session', 'resets'] as const

export function useSessionResetPreview(enabled: boolean) {
  return useQuery({
    queryKey: sessionPreviewQueryKey,
    queryFn: previewSessionReset,
    enabled,
    staleTime: 0,
  })
}

export function useSessionResets(limit = 10) {
  return useQuery({
    queryKey: [...sessionResetsQueryKey, limit] as const,
    queryFn: () => listSessionResets({ limit }),
    staleTime: 30_000,
  })
}

export function useResetSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Omit<ResetSessionRequest, 'confirm'>) => resetSession(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionPreviewQueryKey })
      void queryClient.invalidateQueries({ queryKey: sessionResetsQueryKey })
      void queryClient.invalidateQueries({ queryKey: FIGHTS_QUERY_PREFIX })
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_PREFIX })
      void queryClient.invalidateQueries({ queryKey: ['bets'] })
      void queryClient.invalidateQueries({ queryKey: ['cash'] })
    },
  })
}
