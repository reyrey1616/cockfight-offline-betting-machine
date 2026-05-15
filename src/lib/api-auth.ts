// Auth-specific API calls — plain async functions only.
//
// TanStack hooks (`useLogin`, `useLogout`, `useMe`) live in `@/hooks/useAuth`.
//
// Pattern for other domains: `lib/api-<domain>.ts` (transport) +
// `hooks/<domain>.ts` or `hooks/use-<thing>.ts` (React + cache).

import { api } from '@/lib/api'
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse
} from '@/types/api'

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', body)
  return data
}

export async function me(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>('/auth/me')
  return data
}

export async function changePassword(
  body: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const { data } = await api.post<ChangePasswordResponse>(
    '/auth/change-password',
    body
  )
  return data
}

export async function logout(): Promise<LogoutResponse> {
  const { data } = await api.post<LogoutResponse>('/auth/logout')
  return data
}
