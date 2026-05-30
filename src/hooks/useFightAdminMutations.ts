import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  cancelFight,
  closeFight,
  createFight,
  holdFightSide,
  resumeFightOpen,
  reopenFight,
  setFightLastCall,
  settleFight,
  unholdFightSide
} from '@/lib/api-fights'
import { invalidateAllFightQueries } from '@/lib/fight-query-keys'
import type { BetSideValue } from '@/constants'
import type { CancelFightRequest, Fight, SettleFightRequest } from '@/types/api'

export function useFightAdminMutations(onServerFight: (fight: Fight) => void) {
  const queryClient = useQueryClient()

  const invalidate = () => invalidateAllFightQueries(queryClient)

  const create = useMutation({
    mutationFn: createFight,
    onSuccess: (res) => {
      onServerFight(res.fight)
      invalidate()
    }
  })

  const close = useMutation({
    mutationFn: (id: string) => closeFight(id),
    onSuccess: (res) => {
      onServerFight(res.fight)
      invalidate()
    }
  })

  const reopen = useMutation({
    mutationFn: (id: string) => reopenFight(id),
    onSuccess: (res) => {
      onServerFight(res.fight)
      invalidate()
    }
  })

  const lastCall = useMutation({
    mutationFn: (id: string) => setFightLastCall(id),
    onSuccess: (res) => {
      onServerFight(res.fight)
      invalidate()
    }
  })

  const resumeOpen = useMutation({
    mutationFn: (id: string) => resumeFightOpen(id),
    onSuccess: (res) => {
      onServerFight(res.fight)
      invalidate()
    }
  })

  const settle = useMutation({
    mutationFn: ({ id, body }: { id: string; body: SettleFightRequest }) =>
      settleFight(id, body),
    onSuccess: (res) => {
      onServerFight(res.fight)
      invalidate()
    }
  })

  const cancel = useMutation({
    mutationFn: ({ id, body }: { id: string; body?: CancelFightRequest }) =>
      cancelFight(id, body ?? {}),
    onSuccess: (res) => {
      onServerFight(res.fight)
      invalidate()
    }
  })

  const holdSide = useMutation({
    mutationFn: ({ id, side }: { id: string; side: BetSideValue }) =>
      holdFightSide(id, side),
    onSuccess: (res) => {
      onServerFight(res.fight)
      invalidate()
    }
  })

  const unholdSide = useMutation({
    mutationFn: ({ id, side }: { id: string; side: BetSideValue }) =>
      unholdFightSide(id, side),
    onSuccess: (res) => {
      onServerFight(res.fight)
      invalidate()
    }
  })

  return {
    createFight: create,
    closeFight: close,
    setFightLastCall: lastCall,
    resumeFightOpen: resumeOpen,
    reopenFight: reopen,
    settleFight: settle,
    cancelFight: cancel,
    holdSide: holdSide,
    unholdSide: unholdSide
  }
}
