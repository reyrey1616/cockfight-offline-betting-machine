import { describe, expect, it } from 'vitest'

import { disqualificationMessage, isPayableRefund, isPayableWin } from '@/lib/payout-eligibility'
import { makeBetRow, makeFight } from '@/test/fixtures'
import type { PlaceBetFightSummary } from '@/types/api'

function makeFightSummary(
  overrides: Partial<PlaceBetFightSummary> = {}
): PlaceBetFightSummary {
  const f = makeFight(overrides as Parameters<typeof makeFight>[0])
  return {
    id: f.id,
    fightNumber: f.fightNumber,
    status: f.status,
    outcome: f.outcome,
    meronPool: f.meronPool,
    walaPool: f.walaPool,
    meronOdds: f.meronOdds,
    walaOdds: f.walaOdds,
    payoutRatioMeron: f.payoutRatioMeron,
    payoutRatioWala: f.payoutRatioWala,
    ...overrides
  }
}

describe('isPayableWin', () => {
  it('allows WON on settled fight with payout', () => {
    expect(
      isPayableWin(
        makeBetRow({ status: 'WON', payoutAmount: '270.00' }),
        makeFightSummary({ status: 'SETTLED' })
      )
    ).toBe(true)
  })

  it('blocks pending bet', () => {
    expect(
      isPayableWin(makeBetRow({ status: 'PENDING' }), makeFightSummary({ status: 'SETTLED' }))
    ).toBe(false)
  })
})

describe('isPayableRefund', () => {
  it('allows PENDING_REFUND on cancelled fight', () => {
    expect(
      isPayableRefund(
        makeBetRow({ status: 'PENDING_REFUND', payoutAmount: '100.00' }),
        makeFightSummary({ status: 'CANCELLED' })
      )
    ).toBe(true)
  })

  it('allows PENDING_REFUND on draw fight', () => {
    expect(
      isPayableRefund(
        makeBetRow({ status: 'PENDING_REFUND', payoutAmount: '100.00' }),
        makeFightSummary({ status: 'SETTLED', outcome: 'DRAW' })
      )
    ).toBe(true)
  })
})

describe('disqualificationMessage', () => {
  it('describes pending ticket on settled fight as data anomaly', () => {
    expect(
      disqualificationMessage(
        makeBetRow({ status: 'PENDING' }),
        makeFightSummary({ status: 'SETTLED' })
      )
    ).toMatch(/still pending/i)
  })

  it('says not settled when fight is open', () => {
    expect(
      disqualificationMessage(
        makeBetRow({ status: 'PENDING' }),
        makeFightSummary({ status: 'OPEN' })
      )
    ).toMatch(/not been settled/i)
  })
})
