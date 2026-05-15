// TanStack Query client.
//
// Singleton so cache survives navigations. We tune two defaults for the
// betting-app use case:
//
//   - `retry: 1`     — one automatic retry on network errors. Two would
//                       be excessive on a LAN where a hung request is
//                       usually a real bug, not transient flake.
//   - `staleTime: 0` — data is always re-fetched on mount. The
//                       canonical pattern in this app is "the WS frame
//                       tells you when the data changed, invalidate the
//                       query, refetch happens automatically". Keeping
//                       staleTime at 0 makes that loop predictable.
//                       Per-query overrides via `useQuery({ staleTime })`
//                       are still fine for things that genuinely cache
//                       (e.g. /collectors list).
//
// We deliberately do NOT retry mutations — a 4xx error is the API
// telling you "no, don't try that again" and a duplicate POST without
// the original clientRequestId could double-spend.
import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/lib/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // 4xx — client error, don't retry. Includes 401 (auth) and
        // 403 (forbidden) which we never want to bang against.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }
        return failureCount < 1
      },
      staleTime: 0,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: false
    }
  }
})
