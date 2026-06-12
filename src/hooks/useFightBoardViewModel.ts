import { useMemo } from 'react'

import { ApiError } from '@/lib/api'
import {
  buildFightBoardTicker,
  deriveFightHistory,
  deriveSessionStats,
  FIGHT_BOARD_HISTORY_FETCH_MAX,
  isSideHeld,
  resolveBoardOddsForSide
} from '@/lib/fight-board-derive'
import { useFightLiveState } from '@/hooks/useFightLiveState'
import { useRecentFightsBoard } from '@/hooks/useRecentFightsBoard'
import { useSettings } from '@/hooks/useSettings'

/**
 * Shared fight-board data for `/display`, Operate fights, and the teller
 * live desk — keeps a single `useFightLiveState` subscription per screen.
 */
const DEFAULT_COMMISSION_RATE = '0.1500'

export function useFightBoardViewModel() {
  const { fight, wsStatus, lastWsError, applyServerFight, fightsQuery } = useFightLiveState()
  const recentQuery = useRecentFightsBoard()
  const settingsQuery = useSettings()

  const commissionRate =
    fight?.commissionRate ??
    settingsQuery.data?.setting.commissionRate ??
    DEFAULT_COMMISSION_RATE

  const loading = fightsQuery.isPending && fight == null
  const loadError =
    fightsQuery.error instanceof ApiError
      ? fightsQuery.error.message
      : fightsQuery.error?.message

  const sessionStats = useMemo(() => {
    const fights = recentQuery.data?.fights ?? []
    return deriveSessionStats(fights)
  }, [recentQuery.data])

  const history = useMemo(() => {
    const fights = recentQuery.data?.fights ?? []
    return deriveFightHistory(fights, FIGHT_BOARD_HISTORY_FETCH_MAX)
  }, [recentQuery.data])

  const tickerMessage = useMemo(() => buildFightBoardTicker(fight, null), [fight])

  const meronSideHeld = isSideHeld(fight, 'MERON')
  const walaSideHeld = isSideHeld(fight, 'WALA')

  return {
    fight,
    wsStatus,
    lastWsError,
    applyServerFight,
    fightsQuery,
    loading,
    loadError,
    sessionStats,
    history,
    tickerMessage,
    meronPool: fight?.meronPool ?? '0.00',
    walaPool: fight?.walaPool ?? '0.00',
    meronOdds: resolveBoardOddsForSide(fight, 'MERON', commissionRate),
    walaOdds: resolveBoardOddsForSide(fight, 'WALA', commissionRate),
    fightNumber: fight?.fightNumber ?? null,
    fightStatus: fight?.status ?? null,
    meronSideHeld,
    walaSideHeld
  }
}
