import { useMemo } from 'react'

import { ApiError } from '@/lib/api'
import {
  boardOddsForSide,
  buildFightBoardTicker,
  deriveFightHistory,
  deriveSessionStats,
  FIGHT_BOARD_HISTORY_FETCH_MAX,
  isSideHeld
} from '@/lib/fight-board-derive'
import { useFightLiveState } from '@/hooks/useFightLiveState'
import { useRecentFightsBoard } from '@/hooks/useRecentFightsBoard'

/**
 * Shared fight-board data for `/display`, Operate fights, and the teller
 * live desk — keeps a single `useFightLiveState` subscription per screen.
 */
export function useFightBoardViewModel() {
  const { fight, wsStatus, lastWsError, applyServerFight, fightsQuery } = useFightLiveState()
  const recentQuery = useRecentFightsBoard()

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
    meronOdds: boardOddsForSide(fight, 'MERON'),
    walaOdds: boardOddsForSide(fight, 'WALA'),
    fightNumber: fight?.fightNumber ?? null,
    fightStatus: fight?.status ?? null,
    meronSideHeld,
    walaSideHeld
  }
}
