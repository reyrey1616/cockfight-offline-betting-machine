import type { QueryClient } from '@tanstack/react-query'

/** Prefix for every TanStack cache entry that should refresh after fight / odds changes. */
export const FIGHTS_QUERY_PREFIX = ['fights'] as const

export function invalidateAllFightQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: [...FIGHTS_QUERY_PREFIX] })
}
