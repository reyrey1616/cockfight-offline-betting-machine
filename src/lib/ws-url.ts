import { api } from '@/lib/api'

/** Same host as axios `baseURL` — see `resolveApiBaseUrl` / env vars. */
export function getApiHttpOrigin(): string {
  const base = api.defaults.baseURL ?? 'http://localhost:8000'
  try {
    return new URL(base).origin
  } catch {
    return 'http://localhost:8000'
  }
}

/**
 * `GET /ws` WebSocket upgrade — `cockfigh-offline-betting-api/src/plugins/websocket.plugin.js`.
 */
export function buildRealtimeWebSocketUrl(token: string): string {
  const u = new URL('/ws', getApiHttpOrigin())
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'
  u.searchParams.set('token', token)
  return u.toString()
}
