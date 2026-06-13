import { describe, expect, it } from 'vitest'

import {
  formatBetListOdds,
  betListOddsForSide,
  boardOddsForSide,
  buildFightBoardTicker,
  computePayoutFromOdds,
  defaultBoardOddsMultiplier,
  deriveFightHistory,
  deriveSessionStats,
  fightBoardHistoryViewportHeight,
  floorPayoutMultiplier,
  formatBoardOdds,
  formatPayoutReceiptOdds,
  payoutReceiptOddsMultiplier,
  resolveBoardOddsForSide,
  scaledBoardOdds,
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
  it('scales ratio ×100 and floors to 2 decimals for display', () => {
    expect(formatBoardOdds(1.94257)).toBe('194.25')
    expect(formatBoardOdds(1.64)).toBe('164.00')
    expect(formatBoardOdds(1.7259)).toBe('172.59')
    expect(formatBoardOdds(1.2)).toBe('120.00')
    expect(formatBoardOdds(null)).toBe('—')
  })
})

describe('floorPayoutMultiplier', () => {
  it('matches scaled display ÷ 100', () => {
    expect(floorPayoutMultiplier(1.94257)).toBe(1.9425)
    expect(scaledBoardOdds(1.94257)).toBe(194.25)
  })
})

describe('computePayoutFromOdds', () => {
  it('multiplies stake by the floored payout multiplier', () => {
    expect(computePayoutFromOdds(100, 1.94257)).toBe(194.25)
    expect(computePayoutFromOdds(100, 1.71)).toBe(171)
  })
})


describe('payoutReceiptOddsMultiplier', () => {
  it('prefers settlement ratio, then payout ÷ stake', () => {
    const fight = makeFight({
      status: 'SETTLED',
      payoutRatioWala: '1.9000'
    })
    const bet = {
      side: 'WALA' as const,
      amount: '500.00',
      payoutAmount: '950.00'
    }
    expect(payoutReceiptOddsMultiplier(fight, bet)).toBe(1.9)
    expect(formatPayoutReceiptOdds(fight, bet)).toBe('190.00')
  })

  it('derives odds from payout and stake when ratio is missing', () => {
    const fight = makeFight({ status: 'SETTLED', payoutRatioWala: null })
    const bet = {
      side: 'WALA' as const,
      amount: '500.00',
      payoutAmount: '971.25'
    }
    expect(payoutReceiptOddsMultiplier(fight, bet)).toBeCloseTo(1.9425, 4)
    expect(formatPayoutReceiptOdds(fight, bet)).toBe('194.25')
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

describe('defaultBoardOddsMultiplier', () => {
  it('uses even-split pari-mutuel formula from commission rate', () => {
    expect(defaultBoardOddsMultiplier(0.15)).toBe(1.85)
    expect(formatBoardOdds(defaultBoardOddsMultiplier(0.15))).toBe('185.00')
    expect(defaultBoardOddsMultiplier('0.1000')).toBe(1.9)
    expect(formatBoardOdds(defaultBoardOddsMultiplier('0.1000'))).toBe('190.00')
  })
})

describe('resolveBoardOddsForSide', () => {
  it('falls back to default only while OPEN with empty pools', () => {
    expect(resolveBoardOddsForSide(null, 'MERON', 0.15)).toBeNull()
    const openEmpty = makeFight({
      status: 'OPEN',
      meronPool: '0',
      walaPool: '0',
      meronOdds: null,
      walaOdds: null,
      commissionRate: '0.1500'
    })
    expect(resolveBoardOddsForSide(openEmpty, 'WALA', openEmpty.commissionRate)).toBe(1.85)
  })

  it('keeps last open odds on both sides after settlement', () => {
    const settledWalaWin = makeFight({
      status: 'SETTLED',
      outcome: 'WALA',
      payoutRatioMeron: null,
      payoutRatioWala: '2.5449',
      meronOdds: 1.8543,
      walaOdds: 2.5449
    })
    expect(resolveBoardOddsForSide(settledWalaWin, 'MERON', 0.15)).toBe(1.8543)
    expect(resolveBoardOddsForSide(settledWalaWin, 'WALA', 0.15)).toBe(2.5449)
    expect(formatBoardOdds(resolveBoardOddsForSide(settledWalaWin, 'MERON', 0.15))).toBe('185.43')
    expect(formatBoardOdds(resolveBoardOddsForSide(settledWalaWin, 'WALA', 0.15))).toBe('254.49')
  })

  it('keeps live odds when the API provides them', () => {
    const fight = makeFight({ status: 'OPEN', meronOdds: 2.45, walaOdds: 1.88 })
    expect(resolveBoardOddsForSide(fight, 'MERON', fight.commissionRate)).toBe(2.45)
  })
})

describe('betListOddsForSide', () => {
  it('shows pool odds for a losing side after settlement', () => {
    const lostMeron = {
      side: 'MERON' as const,
      meronOdds: 2.7688,
      walaOdds: 1.389,
      status: 'LOST' as const
    }
    expect(betListOddsForSide(lostMeron)).toBe(2.7688)
    expect(formatBetListOdds(lostMeron)).toBe('276.88')
  })

  it('shows pool odds for the winning side too', () => {
    const wonWala = {
      side: 'WALA' as const,
      meronOdds: 1.4531,
      walaOdds: 2.5449
    }
    expect(formatBetListOdds(wonWala)).toBe('254.49')
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

  it('keeps last open odds after settlement (not payout ratio)', () => {
    const fight = makeFight({
      status: 'SETTLED',
      meronOdds: 2.45,
      payoutRatioMeron: '2.3020'
    })
    expect(boardOddsForSide(fight, 'MERON')).toBe(2.45)
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
