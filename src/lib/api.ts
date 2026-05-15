// API client.
//
// Single axios instance for the whole app. Two responsibilities:
//
//   1. Inject Authorization: Bearer <token> on every request when a
//      token exists in the auth store. We READ the store at request
//      time (not at instance creation) so logging in mid-session
//      starts attaching the header immediately and logout removes it
//      immediately.
//
//   2. Normalize errors. The backend ALWAYS returns the same envelope
//      `{ error: { code, message, details? } }` (see api-schemas.js).
//      We unwrap that and rethrow an `ApiError` carrying the same
//      fields plus the HTTP status — TanStack Query mutation handlers
//      can then do `catch ((e: ApiError) => …)` without re-parsing.
//
//   3. Special-case 401. When the server replies 401 we clear the
//      auth store so the route guard kicks in on the next render and
//      sends the user to /login. We DO NOT redirect from this layer —
//      that would couple the network code to React Router. The store
//      change + route guard combination is the canonical pattern.
//
// Everything else (caching, retries, request dedupe) lives in
// TanStack Query, not here. This file is intentionally small.

import axios, { AxiosError, type AxiosInstance } from 'axios'

import { resolveApiBaseUrl } from '@/lib/api-base-url'
import { useAuthStore } from '@/store/auth'
import type { ApiErrorBody } from '@/types/api'

const BASE_URL = resolveApiBaseUrl()

// Created ONCE at module load. Anywhere in the app that needs to talk
// to the API imports `api` from here — never construct another axios
// instance, that would bypass our interceptors.
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  // 15s is generous for a LAN deployment but short enough that a hung
  // request surfaces a UX error instead of spinning forever.
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ---------------------------------------------------------------------------
// Request interceptor — inject bearer token.
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    // axios v1: headers is an AxiosHeaders instance with `.set()`.
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — normalize errors + handle 401.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiErrorBody>) => {
    // 401 ANYWHERE means our bearer is invalid (expired, revoked by
    // admin via isActive=false, or never valid). Clear the store so
    // route guards send the user to /login. We do this BEFORE
    // rejecting so the caller's catch handler sees `useAuthStore` in
    // the already-logged-out state.
    if (err.response?.status === 401) {
      useAuthStore.getState().clear()
    }

    // Unwrap the backend's structured error envelope when present.
    // Network errors (no response) still get a meaningful message.
    const body = err.response?.data
    const message =
      body?.error?.message ??
      err.message ??
      'Network error — is the server reachable?'
    const code = body?.error?.code ?? 'NETWORK_ERROR'
    const status = err.response?.status ?? 0
    const details = body?.error?.details

    return Promise.reject(new ApiError(message, { code, status, details }))
  }
)

// ---------------------------------------------------------------------------
// Public error type. Anything thrown by `api.*` is an ApiError; nothing
// else needs to know about axios.
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  code: string
  status: number
  details?: unknown
  constructor(
    message: string,
    opts: { code: string; status: number; details?: unknown }
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = opts.code
    this.status = opts.status
    this.details = opts.details
  }
}
