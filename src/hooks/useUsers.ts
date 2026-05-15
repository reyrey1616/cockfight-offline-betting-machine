import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { USER_ROLE_VALUE } from '@/constants'
import {
  createUser,
  listUsers,
  resetUserPassword,
  updateUser
} from '@/lib/api-users'
import type { UpdateUserRequest } from '@/types/api'

const tellersQueryKey = ['users', 'list', { role: USER_ROLE_VALUE.TELLER }] as const

/** Active + inactive tellers for admin screens. */
export function useTellersList(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: tellersQueryKey,
    queryFn: () => listUsers({ role: USER_ROLE_VALUE.TELLER }),
    enabled: options?.enabled ?? true
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tellersQueryKey })
    }
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserRequest }) =>
      updateUser(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tellersQueryKey })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tellersQueryKey })
    }
  })
}
