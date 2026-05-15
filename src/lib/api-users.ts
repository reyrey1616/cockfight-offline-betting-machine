import { api } from '@/lib/api'
import type {
  CreateUserRequest,
  CreateUserResponse,
  ListUsersQuery,
  ListUsersResponse,
  ResetUserPasswordRequest,
  ResetUserPasswordResponse,
  UpdateUserRequest,
  UpdateUserResponse
} from '@/types/api'

/** GET /users — admin list (optional filters). Hook: `@/hooks/useUsers` `useTellersList`. */
export async function listUsers(
  params?: ListUsersQuery
): Promise<ListUsersResponse> {
  const { data } = await api.get<ListUsersResponse>('/users', { params })
  return data
}

/** POST /users — admin create. Hook: `@/hooks/useUsers` `useCreateUser`. */
export async function createUser(
  body: CreateUserRequest
): Promise<CreateUserResponse> {
  const { data } = await api.post<CreateUserResponse>('/users', body)
  return data
}

/** PATCH /users/:id — admin update `fullName` / `isActive`. Hook: `useUpdateUser`. */
export async function updateUser(
  id: string,
  body: UpdateUserRequest
): Promise<UpdateUserResponse> {
  const { data } = await api.patch<UpdateUserResponse>(`/users/${id}`, body)
  return data
}

/** POST /users/:id/password — admin password reset. Hook: `useResetUserPassword`. */
export async function resetUserPassword(
  id: string,
  body: ResetUserPasswordRequest
): Promise<ResetUserPasswordResponse> {
  const { data } = await api.post<ResetUserPasswordResponse>(
    `/users/${id}/password`,
    body
  )
  return data
}
