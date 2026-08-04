import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getFight, listFights } from '@/lib/api-fights'
import { CASH_BALANCE_QUERY_KEY } from '@/lib/cash-query-keys'
import { invalidateAllFightQueries } from '@/lib/fight-query-keys'
import { buildRealtimeWebSocketUrl } from '@/lib/ws-url'
import {
  mergeFightCorrected,
  mergeFightLifecycleProjection,
  mergeOddsUpdate,
  mergeSideAcceptingFrame,
  pickCurrentDisplayFight,
  welcomeSnapshotToFight
} from '@/lib/live-fight-ws-merge'
import { useAuthToken } from '@/store/auth'
import type { Fight, FightWelcomeSnapshot } from '@/types/api'

// ---------------------------------------------------------------------------
// Reducer — REST bootstrap + full replace from mutations / getFight.
// WebSocket merges call the same `dispatch` with `APPLY_FULL` or granular
// merge actions so we never fight TanStack Query for pool freshness.
// ---------------------------------------------------------------------------

type LiveFightState = { fight: Fight | null }

type LiveFightAction =
  | { type: 'APPLY_FULL'; fight: Fight }
  | { type: 'CLEAR' }
  | { type: 'REST_BOOTSTRAP'; fight: Fight | undefined }
  | {
      type: 'MERGE_ODDS'
      data: {
        fightId: string
        meronPool: string
        walaPool: string
        meronOdds: number | null
        walaOdds: number | null
      }
    }
  | { type: 'MERGE_LIFECYCLE'; data: Record<string, unknown> }
  | { type: 'MERGE_CORRECTED'; data: Record<string, unknown> }
  | {
      type: 'MERGE_SIDE'
      data: {
        fightId: string
        accepting: { meron: boolean; wala: boolean }
      }
    }

function liveFightReducer(
  state: LiveFightState,
  action: LiveFightAction
): LiveFightState {
  switch (action.type) {
    case 'APPLY_FULL':
      return { fight: action.fight }
    case 'CLEAR':
      return { fight: null }
    case 'REST_BOOTSTRAP': {
      const pick = action.fight
      if (!pick) return state
      if (!state.fight) return { fight: pick }
      // Do not replace a newer fight (WS / mutation) with an older CLOSED row
      // after settlement — REST `current` used to omit SETTLED and pick #10.
      if (pick.fightNumber > state.fight.fightNumber) return { fight: pick }
      return state
    }
    case 'MERGE_ODDS': {
      if (!state.fight) return state
      const next = mergeOddsUpdate(state.fight, action.data)
      return next ? { fight: next } : state
    }
    case 'MERGE_LIFECYCLE': {
      if (!state.fight) return state
      const next = mergeFightLifecycleProjection(state.fight, action.data)
      return next ? { fight: next } : state
    }
    case 'MERGE_CORRECTED': {
      if (!state.fight) return state
      const next = mergeFightCorrected(state.fight, action.data)
      return next ? { fight: next } : state
    }
    case 'MERGE_SIDE': {
      if (!state.fight) return state
      const next = mergeSideAcceptingFrame(state.fight, action.data)
      return next ? { fight: next } : state
    }
    default:
      return state
  }
}

export type WsConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed'
  | 'auth_error'

const fightsCurrentQueryKey = ['fights', 'current'] as const

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

export function useFightLiveState() {
  const token = useAuthToken()
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(liveFightReducer, { fight: null })
  const [wsConnStatus, setWsConnStatus] = useState<WsConnectionStatus>('idle')
  const [lastWsError, setLastWsError] = useState<string | null>(null)

  const reconnectAttempt = useRef(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopped = useRef(false)

  const listQuery = useQuery({
    queryKey: fightsCurrentQueryKey,
    queryFn: () => listFights({ current: true, limit: 25 }),
    enabled: Boolean(token),
    staleTime: 15_000
  })

  useEffect(() => {
    const pick = pickCurrentDisplayFight(listQuery.data?.fights)
    dispatch({ type: 'REST_BOOTSTRAP', fight: pick })
  }, [listQuery.data])

  const applyServerFight = useCallback((fight: Fight) => {
    dispatch({ type: 'APPLY_FULL', fight })
  }, [])

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
      setWsConnStatus('reconnecting')
      reconnectTimer.current = setTimeout(() => {
        connect()
      }, delayMs)
    }

    const connect = () => {
      if (stopped.current) return
      clearReconnectTimer()
      wsRef.current?.close()
      setWsConnStatus('connecting')
      setLastWsError(null)

      let socket: WebSocket
      try {
        socket = new WebSocket(buildRealtimeWebSocketUrl(token))
      } catch (e) {
        setLastWsError(e instanceof Error ? e.message : 'WebSocket URL error')
        scheduleReconnect()
        return
      }

      wsRef.current = socket

      socket.onopen = () => {
        reconnectAttempt.current = 0
        setWsConnStatus('open')
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

        if (msg.type === 'WELCOME' && isRecord(msg.data)) {
          const cf = msg.data.currentFight
          const ts = msg.ts ?? new Date().toISOString()
          if (cf == null) {
            dispatch({ type: 'CLEAR' })
          } else if (isRecord(cf)) {
            const snap = cf as unknown as FightWelcomeSnapshot
            if (typeof snap.id === 'string') {
              dispatch({
                type: 'APPLY_FULL',
                fight: welcomeSnapshotToFight(snap, ts)
              })
            }
          }
          void invalidateAllFightQueries(queryClient)
          return
        }

        if (msg.type === 'ODDS_UPDATE' && isRecord(msg.data)) {
          const d = msg.data
          if (
            typeof d.fightId === 'string' &&
            typeof d.meronPool === 'string' &&
            typeof d.walaPool === 'string' &&
            (typeof d.meronOdds === 'number' || d.meronOdds === null) &&
            (typeof d.walaOdds === 'number' || d.walaOdds === null)
          ) {
            dispatch({
              type: 'MERGE_ODDS',
              data: {
                fightId: d.fightId,
                meronPool: d.meronPool,
                walaPool: d.walaPool,
                meronOdds: d.meronOdds,
                walaOdds: d.walaOdds
              }
            })
          }
          return
        }

        if (msg.type === 'FIGHT_OPENED' && isRecord(msg.data)) {
          const fid = msg.data.fightId
          if (typeof fid === 'string') {
            void getFight(fid)
              .then((r) => {
                dispatch({ type: 'APPLY_FULL', fight: r.fight })
              })
              .catch(() => {
                void invalidateAllFightQueries(queryClient)
              })
          }
          void invalidateAllFightQueries(queryClient)
          return
        }

        if (
          (msg.type === 'FIGHT_CLOSED' ||
            msg.type === 'FIGHT_SETTLED' ||
            msg.type === 'FIGHT_CANCELLED' ||
            msg.type === 'FIGHT_UNSETTLED') &&
          isRecord(msg.data)
        ) {
          dispatch({ type: 'MERGE_LIFECYCLE', data: msg.data })
          void invalidateAllFightQueries(queryClient)
          return
        }

        if (msg.type === 'FIGHT_CORRECTED' && isRecord(msg.data)) {
          dispatch({ type: 'MERGE_CORRECTED', data: msg.data })
          void invalidateAllFightQueries(queryClient)
          return
        }

        if (msg.type === 'TELLER_BALANCE_UPDATED' && isRecord(msg.data)) {
          void queryClient.invalidateQueries({ queryKey: CASH_BALANCE_QUERY_KEY })
          return
        }

        if (
          (msg.type === 'SIDE_HELD' || msg.type === 'SIDE_UNHELD') &&
          isRecord(msg.data)
        ) {
          const d = msg.data
          const fid = d.fightId
          const acc = d.accepting
          if (
            typeof fid === 'string' &&
            isRecord(acc) &&
            typeof acc.meron === 'boolean' &&
            typeof acc.wala === 'boolean'
          ) {
            dispatch({
              type: 'MERGE_SIDE',
              data: {
                fightId: fid,
                accepting: { meron: acc.meron, wala: acc.wala }
              }
            })
          }
        }
      }

      socket.onerror = () => {
        setLastWsError('WebSocket error')
      }

      socket.onclose = (ev) => {
        wsRef.current = null
        if (stopped.current) {
          setWsConnStatus('closed')
          return
        }
        if (ev.code === 4401 || ev.code === 4403) {
          setWsConnStatus('auth_error')
          setLastWsError(ev.reason || 'Unauthorized WebSocket')
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
      setWsConnStatus('closed')
    }
  }, [token, queryClient])

  const wsStatus: WsConnectionStatus = token ? wsConnStatus : 'idle'

  return {
    fight: state.fight,
    wsStatus,
    lastWsError: token ? lastWsError : null,
    applyServerFight,
    fightsQuery: listQuery
  }
}
