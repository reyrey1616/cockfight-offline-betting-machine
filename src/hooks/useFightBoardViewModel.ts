import { useMemo } from 'react'

import { ApiError } from '@/lib/api'
import {
  buildFightBoardTicker,
  deriveFightHistory,
  deriveSessionStats
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
    return deriveFightHistory(fights, 14)
  }, [recentQuery.data])

  const tickerMessage = useMemo(() => buildFightBoardTicker(fight, null), [fight])

  const meronSideHeld =
    fight?.status === 'OPEN' && fight.meronAcceptingBets === false
  const walaSideHeld =
    fight?.status === 'OPEN' && fight.walaAcceptingBets === false

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
    meronOdds: fight?.meronOdds ?? null,
    walaOdds: fight?.walaOdds ?? null,
    fightNumber: fight?.fightNumber ?? null,
    fightStatus: fight?.status ?? null,
    meronSideHeld,
    walaSideHeld
  }
}
