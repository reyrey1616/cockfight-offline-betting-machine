import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
  DASHBOARD_LIVE_QUERY_PREFIX,
  DASHBOARD_QUERY_PREFIX
} from '@/lib/dashboard-query-keys'
import { buildRealtimeWebSocketUrl } from '@/lib/ws-url'
import { useAuthToken } from '@/store/auth'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseWsMessage(raw: unknown): {
  type: string
  data?: unknown
  ts?: string
} | null {
  if (typeof raw !== 'string') return null
  try {
    const v: unknown = JSON.parse(raw)
    if (!isRecord(v) || typeof v.type !== 'string') return null
    return {
      type: v.type,
      data: v.data,
      ts: typeof v.ts === 'string' ? v.ts : undefined
    }
  } catch {
    return null
  }
}

export type DashboardWsStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed'
  | 'auth_error'

/**
 * Subscribes to the same realtime channel as the fight board so dashboard
 * tables can invalidate TanStack Query without polling.
 *
 * Live tables: betting activity, teller balances, payout ledger, winning (unpaid) tickets,
 * cancelled tickets, per-teller commission (admin).
 */
export function useDashboardRealtime() {
  const token = useAuthToken()
  const queryClient = useQueryClient()
  const [socketStatus, setSocketStatus] = useState<DashboardWsStatus>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const reconnectAttempt = useRef(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopped = useRef(false)

  useEffect(() => {
    stopped.current = false
    if (!token) {
      return
    }

    const clearReconnectTimer = () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current)
        reconnectTimer.current = null
      }
    }

    const scheduleReconnect = () => {
      if (stopped.current) return
      clearReconnectTimer()
      const n = reconnectAttempt.current
      const delayMs = Math.min(30_000, 1000 * 2 ** Math.min(n, 5))
      reconnectAttempt.current = n + 1
      setSocketStatus('reconnecting')
      reconnectTimer.current = setTimeout(() => {
        connect()
      }, delayMs)
    }

    const invalidateLive = () => {
      void queryClient.invalidateQueries({ queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX] })
    }

    const invalidateAllDashboard = () => {
      void queryClient.invalidateQueries({ queryKey: [...DASHBOARD_QUERY_PREFIX] })
    }

    const connect = () => {
      if (stopped.current) return
      clearReconnectTimer()
      wsRef.current?.close()
      setSocketStatus('connecting')
      setLastError(null)

      let socket: WebSocket
      try {
        socket = new WebSocket(buildRealtimeWebSocketUrl(token))
      } catch (e) {
        setLastError(e instanceof Error ? e.message : 'WebSocket URL error')
        scheduleReconnect()
        return
      }

      wsRef.current = socket

      socket.onopen = () => {
        reconnectAttempt.current = 0
        setSocketStatus('open')
      }

      socket.onmessage = (ev) => {
        const msg = parseWsMessage(ev.data)
        if (!msg) return

        if (msg.type === 'PING') {
          try {
            socket.send(JSON.stringify({ type: 'PONG' }))
          } catch {
            /* ignore */
          }
          return
        }

        if (msg.type === 'SESSION_RESET') {
          invalidateAllDashboard()
          return
        }

        if (
          msg.type === 'ODDS_UPDATE' ||
          msg.type === 'TELLER_BALANCE_UPDATED' ||
          msg.type === 'TELLER_COMMISSIONS_UPDATED' ||
          msg.type === 'FIGHT_SETTLED' ||
          msg.type === 'FIGHT_CORRECTED' ||
          msg.type === 'FIGHT_CANCELLED'
        ) {
          invalidateLive()
        }
      }

      socket.onerror = () => {
        setLastError('WebSocket error')
      }

      socket.onclose = (ev) => {
        wsRef.current = null
        if (stopped.current) {
          setSocketStatus('closed')
          return
        }
        if (ev.code === 4401 || ev.code === 4403) {
          setSocketStatus('auth_error')
          setLastError(ev.reason || 'Unauthorized WebSocket')
          return
        }
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      stopped.current = true
      clearReconnectTimer()
      wsRef.current?.close()
      wsRef.current = null
      setSocketStatus('closed')
    }
  }, [token, queryClient])

  return {
    wsStatus: token ? socketStatus : 'idle',
    lastWsError: token ? lastError : null
  }
}
