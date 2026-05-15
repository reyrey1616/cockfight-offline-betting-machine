import { type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'

import { queryClient } from '@/lib/query'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Root composition for app-wide React providers.
 *
 * Auth stays on Zustand (`@/store/auth`) — no `AuthProvider` wrapper.
 * Add future `createContext` providers here (active fight, locale, etc.)
 * nested inside `QueryClientProvider` when they need the query cache.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-center" closeButton />
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  )
}
