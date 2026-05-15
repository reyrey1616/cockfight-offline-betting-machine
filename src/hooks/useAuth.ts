import { useMutation, useQuery } from '@tanstack/react-query'

import {
  login,
  logout,
  me
} from '@/lib/api-auth'
import { queryClient } from '@/lib/query'
import { useAuthStore } from '@/store/auth'

/** POST /auth/login — persists session in the zustand store on success. */
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data.token, data.user)
    }
  })
}

/** GET /auth/me — bearer freshness probe; disabled without a token. */
export function useMe() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: me,
    enabled: Boolean(token),
    staleTime: 60_000
  })
}

/** POST /auth/logout — clears store + query cache on settled (even on network error). */
export function useLogout() {
  const clear = useAuthStore((s) => s.clear)
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clear()
      queryClient.clear()
    }
  })
}
