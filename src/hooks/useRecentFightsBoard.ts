import { useQuery } from '@tanstack/react-query'

import { listFights } from '@/lib/api-fights'
import { FIGHTS_QUERY_PREFIX } from '@/lib/fight-query-keys'
import { useAuthToken } from '@/store/auth'

const RECENT_LIMIT = 120

/** Recent fights for session tallies + history column (invalidated with all `['fights']` queries). */
export function useRecentFightsBoard() {
  const token = useAuthToken()

  return useQuery({
    queryKey: [...FIGHTS_QUERY_PREFIX, 'recent', RECENT_LIMIT],
    queryFn: () => listFights({ limit: RECENT_LIMIT }),
    staleTime: 10_000,
    enabled: Boolean(token)
  })
}
