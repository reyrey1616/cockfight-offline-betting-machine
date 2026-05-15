import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getSettings, updateSettings } from '@/lib/api-settings'

const settingsQueryKey = ['settings'] as const

export function useSettings() {
  return useQuery({
    queryKey: settingsQueryKey,
    queryFn: getSettings,
    staleTime: 30_000
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKey })
    }
  })
}
