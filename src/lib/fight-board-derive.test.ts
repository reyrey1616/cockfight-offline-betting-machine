import { describe, expect, it } from 'vitest'

import {
  boardOddsForSide,
  buildFightBoardTicker,
  deriveFightHistory,
  deriveSessionStats,
  fightBoardHistoryViewportHeight,
  formatBoardOdds,
  settledOddsForSide,
  formatFightLabel,
  FIGHT_BOARD_HISTORY_FETCH_MAX,
  FIGHT_BOARD_HISTORY_VISIBLE_ROWS
} from '@/lib/fight-board-derive'
import { makeFight } from '@/test/fixtures'

describe('formatFightLabel', () => {
  it('prefixes fight numbers with #', () => {
    expect(formatFightLabel(1)).toBe('#1')
    expect(formatFightLabel(1002)).toBe('#1002')
  })

  it('returns em dash when number is missing', () => {
    expect(formatFightLabel(null)).toBe('—')
    expect(formatFightLabel(undefined)).toBe('—')
  })
})

describe('fightBoardHistoryViewportHeight', () => {
  it('sizes viewport for six visible rows', () => {
    expect(fightBoardHistoryViewportHeight()).toBe('calc(6 * 3rem + 5 * 0.25rem)')
    expect(FIGHT_BOARD_HISTORY_VISIBLE_ROWS).toBe(6)
    expect(FIGHT_BOARD_HISTORY_FETCH_MAX).toBeGreaterThan(6)
  })
})

describe('deriveSessionStats', () => {
  it('tallies meron, wala, draw, and cancelled fights', () => {
    const fights = [
      makeFight({ fightNumber: 1, status: 'SETTLED', outcome: 'MERON' }),
      makeFight({ fightNumber: 2, status: 'SETTLED', outcome: 'WALA' }),
      makeFight({ fightNumber: 3, status: 'SETTLED', outcome: 'DRAW' }),
      makeFight({ fightNumber: 4, status: 'CANCELLED', outcome: null }),
      makeFight({ fightNumber: 5, status: 'OPEN', outcome: null })
    ]
    expect(deriveSessionStats(fights)).toEqual({
      meronWins: 1,
      walaWins: 1,
      draws: 1,
      cancelled: 1
    })
  })
})

describe('deriveFightHistory', () => {
  it('returns newest finished fights first and respects maxRows', () => {
    const fights = Array.from({ length: 10 }, (_, i) =>
      makeFight({
        fightNumber: i + 1,
        status: 'SETTLED',
        outcome: i % 2 === 0 ? 'MERON' : 'WALA'
      })
    )
    const rows = deriveFightHistory(fights, 6)
    expect(rows).toHaveLength(6)
    expect(rows[0].fightNumber).toBe(10)
    expect(rows[5].fightNumber).toBe(5)
  })

  it('includes cancelled fights in history', () => {
    const rows = deriveFightHistory(
      [makeFight({ fightNumber: 2, status: 'CANCELLED' })],
      6
    )
    expect(rows).toEqual([{ fightNumber: 2, result: 'CANCELLED' }])
  })

  it('skips open fights', () => {
    const rows = deriveFightHistory([makeFight({ status: 'OPEN' })], 6)
    expect(rows).toHaveLength(0)
  })
})

describe('formatBoardOdds', () => {
  it('formats odds as integer without decimal point (floor × 100)', () => {
    expect(formatBoardOdds(1.64)).toBe('164')
    expect(formatBoardOdds(1.7259)).toBe('172')
    expect(formatBoardOdds(1.2)).toBe('120')
    expect(formatBoardOdds(null)).toBe('—')
  })
})


describe('settledOddsForSide', () => {
  it('returns payout ratio for the bet side', () => {
    const fight = {
      payoutRatioMeron: '1.8123',
      payoutRatioWala: '2.3500'
    }
    expect(settledOddsForSide(fight, 'WALA')).toBe(2.35)
    expect(settledOddsForSide(fight, 'MERON')).toBe(1.8123)
  })
})

describe('boardOddsForSide', () => {
  it('uses live odds while betting is open', () => {
    const fight = makeFight({
      status: 'OPEN',
      meronOdds: 2.45,
      payoutRatioMeron: '2.3020'
    })
    expect(boardOddsForSide(fight, 'MERON')).toBe(2.45)
  })

  it('uses frozen payout ratio after settlement', () => {
    const fight = makeFight({
      status: 'SETTLED',
      meronOdds: 2.45,
      payoutRatioMeron: '2.3020'
    })
    expect(boardOddsForSide(fight, 'MERON')).toBe(2.302)
  })
})

describe('buildFightBoardTicker', () => {
  it('announces standby when no fight', () => {
    expect(buildFightBoardTicker(null, null)).toBe('NO ACTIVE FIGHT — STANDBY.')
  })

  it('announces open fight with hold flags', () => {
    const fight = makeFight({
      fightNumber: 3,
      status: 'OPEN',
      meronAcceptingBets: false,
      walaAcceptingBets: true
    })
    expect(buildFightBoardTicker(fight, null)).toContain('FIGHT #3')
    expect(buildFightBoardTicker(fight, null)).toContain('MERON HELD')
  })

  it('announces settled result', () => {
    const fight = makeFight({
      fightNumber: 2,
      status: 'SETTLED',
      outcome: 'DRAW'
    })
    expect(buildFightBoardTicker(fight, null)).toBe('FIGHT #2 — RESULT: DRAW.')
  })
})
