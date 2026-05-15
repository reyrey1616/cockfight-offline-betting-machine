import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createCollector, listCollectors, updateCollector } from '@/lib/api-collectors'
import type { UpdateCollectorRequest } from '@/types/api'

const collectorsActiveListQueryKey = ['collectors', 'list', { isActive: true }] as const
const collectorsListInvalidationKey = ['collectors', 'list'] as const

export function useCollectorsList() {
  return useQuery({
    queryKey: collectorsActiveListQueryKey,
    queryFn: () => listCollectors({ isActive: true })
  })
}

export function useCreateCollector() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCollector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectorsListInvalidationKey })
    }
  })
}

export function useUpdateCollector() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCollectorRequest }) =>
      updateCollector(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectorsListInvalidationKey })
    }
  })
}
