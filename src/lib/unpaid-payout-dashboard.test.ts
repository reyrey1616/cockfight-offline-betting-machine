import { describe, expect, it } from 'vitest'

import { UNPAID_PAYOUT_DASHBOARD_MINUTES } from '@/constants'
import { makeBetRow } from '@/test/fixtures'
import {
  filterUnpaidPayoutsForDashboard,
  isVisibleOnMyTellerUnpaidPayouts,
  isVisibleOnUnpaidPayoutsDashboard,
  UNPAID_PAYOUT_DASHBOARD_TTL_MS
} from '@/lib/unpaid-payout-dashboard'
import type { BetListRow } from '@/types/api'

const WINDOW_MS = UNPAID_PAYOUT_DASHBOARD_TTL_MS
const WINDOW_MINUTES = UNPAID_PAYOUT_DASHBOARD_MINUTES

function makeListRow(overrides: Partial<BetListRow> = {}): BetListRow {
  return {
    ...makeBetRow({ status: 'WON', payoutAmount: '100.00' }),
    fightNumber: 1,
    fightStatus: 'SETTLED',
    meronOdds: 1.5,
    walaOdds: 2,
    payoutRatioMeron: '1.5',
    payoutRatioWala: '2',
    fightEndedAt: null,
    ...overrides
  }
}

describe('unpaid payout dashboard visibility', () => {
  it('shows tickets with no fight end time', () => {
    expect(isVisibleOnUnpaidPayoutsDashboard(makeListRow({ fightEndedAt: null }))).toBe(true)
  })

  it('shows tickets within the dashboard window after fight settle/cancel', () => {
    const now = Date.parse('2026-06-27T13:00:00.000Z')
    const bet = makeListRow({
      fightEndedAt: new Date(now - (WINDOW_MINUTES - 5) * 60 * 1000).toISOString()
    })
    expect(isVisibleOnUnpaidPayoutsDashboard(bet, now)).toBe(true)
  })

  it('hides tickets after the dashboard window', () => {
    const now = Date.parse('2026-06-27T13:00:00.000Z')
    const bet = makeListRow({
      fightEndedAt: new Date(now - WINDOW_MS - 1).toISOString()
    })
    expect(isVisibleOnUnpaidPayoutsDashboard(bet, now)).toBe(false)
  })

  it('filters a mixed list', () => {
    const now = Date.parse('2026-06-27T13:00:00.000Z')
    const fresh = makeListRow({
      id: 'fresh',
      fightEndedAt: new Date(now - Math.floor(WINDOW_MS / 2)).toISOString()
    })
    const stale = makeListRow({
      id: 'stale',
      fightEndedAt: new Date(now - WINDOW_MS - 5 * 60 * 1000).toISOString()
    })
    const visible = filterUnpaidPayoutsForDashboard([fresh, stale], now)
    expect(visible.map((b) => b.id)).toEqual(['fresh'])
  })
})

describe('my-teller unpaid archive', () => {
  it('hides tickets still within the dashboard window', () => {
    const now = Date.parse('2026-06-27T13:00:00.000Z')
    const bet = makeListRow({
      fightEndedAt: new Date(now - Math.floor(WINDOW_MS / 2)).toISOString()
    })
    expect(isVisibleOnMyTellerUnpaidPayouts(bet, now)).toBe(false)
  })

  it('shows tickets after the dashboard window', () => {
    const now = Date.parse('2026-06-27T13:00:00.000Z')
    const bet = makeListRow({
      fightEndedAt: new Date(now - WINDOW_MS).toISOString()
    })
    expect(isVisibleOnMyTellerUnpaidPayouts(bet, now)).toBe(true)
  })

  it('requires fightEndedAt', () => {
    expect(isVisibleOnMyTellerUnpaidPayouts(makeListRow({ fightEndedAt: null }))).toBe(false)
  })
})
