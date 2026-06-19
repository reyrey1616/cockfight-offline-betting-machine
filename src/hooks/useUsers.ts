import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { USER_ROLE_VALUE } from '@/constants'
import {
  createUser,
  getTellerLoginBarcode,
  listUsers,
  resetUserPassword,
  updateUser
} from '@/lib/api-users'
import type { UpdateUserRequest } from '@/types/api'

const tellersQueryKey = ['users', 'list', { role: USER_ROLE_VALUE.TELLER, isActive: true }] as const
const tellersListInvalidationKey = ['users', 'list'] as const

/** Active tellers for admin screens and dashboard filters. */
export function useTellersList(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: tellersQueryKey,
    queryFn: () => listUsers({ role: USER_ROLE_VALUE.TELLER, isActive: true }),
    enabled: options?.enabled ?? true
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tellersListInvalidationKey })
    }
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserRequest }) =>
      updateUser(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tellersListInvalidationKey })
    }
  })
}

export function useResetUserPassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      newPassword
    }: {
      id: string
      newPassword: string
    }) => resetUserPassword(id, { newPassword }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: tellersListInvalidationKey })
      queryClient.invalidateQueries({ queryKey: ['users', 'barcode', id] })
    }
  })
}

export function useTellerLoginBarcode(tellerId: string | undefined) {
  return useQuery({
    queryKey: ['users', 'barcode', tellerId],
    queryFn: () => getTellerLoginBarcode(tellerId!),
    enabled: Boolean(tellerId),
    staleTime: 30_000
  })
}
