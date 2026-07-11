import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useFightWinnerFlash } from '@/hooks/useFightWinnerFlash'
import { makeFight } from '@/test/fixtures'

describe('useFightWinnerFlash', () => {
  it('flashes when a fight is settled with Meron', () => {
    const { result, rerender } = renderHook(
      ({ fight }) => useFightWinnerFlash(fight),
      {
        initialProps: {
          fight: makeFight({ id: 'f1', status: 'OPEN', outcome: null, fightNumber: 7 })
        }
      }
    )

    expect(result.current.flash).toBeNull()

    act(() => {
      rerender({
        fight: makeFight({
          id: 'f1',
          status: 'SETTLED',
          outcome: 'MERON',
          fightNumber: 7,
          settledAt: '2026-07-11T03:00:00.000Z'
        })
      })
    })

    expect(result.current.flash).toEqual({ outcome: 'MERON', fightNumber: 7 })
  })

  it('flashes when a fight is settled with Draw', () => {
    const { result, rerender } = renderHook(
      ({ fight }) => useFightWinnerFlash(fight),
      {
        initialProps: {
          fight: makeFight({ id: 'f2', status: 'CLOSED', outcome: null, fightNumber: 8 })
        }
      }
    )

    act(() => {
      rerender({
        fight: makeFight({
          id: 'f2',
          status: 'SETTLED',
          outcome: 'DRAW',
          fightNumber: 8,
          settledAt: '2026-07-11T03:05:00.000Z'
        })
      })
    })

    expect(result.current.flash).toEqual({ outcome: 'DRAW', fightNumber: 8 })
  })

  it('flashes when a fight is cancelled', () => {
    const { result, rerender } = renderHook(
      ({ fight }) => useFightWinnerFlash(fight),
      {
        initialProps: {
          fight: makeFight({ id: 'f3', status: 'OPEN', outcome: null, fightNumber: 9 })
        }
      }
    )

    act(() => {
      rerender({
        fight: makeFight({
          id: 'f3',
          status: 'CANCELLED',
          outcome: null,
          fightNumber: 9,
          cancelledAt: '2026-07-11T03:10:00.000Z'
        })
      })
    })

    expect(result.current.flash).toEqual({ outcome: 'CANCELLED', fightNumber: 9 })
  })

  it('does not flash on hydrate of an already settled fight', () => {
    const { result } = renderHook(() =>
      useFightWinnerFlash(
        makeFight({
          id: 'f4',
          status: 'SETTLED',
          outcome: 'WALA',
          fightNumber: 10,
          settledAt: '2026-07-11T02:00:00.000Z'
        })
      )
    )

    expect(result.current.flash).toBeNull()
  })
})
