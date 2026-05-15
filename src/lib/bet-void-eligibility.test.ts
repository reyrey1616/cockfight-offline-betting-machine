import { describe, expect, it } from 'vitest'

import { getBetVoidEligibility } from '@/lib/bet-void-eligibility'
import { makeBetRow, makeFight } from '@/test/fixtures'

describe('getBetVoidEligibility', () => {
  it('allows cancel for pending bet on open fight', () => {
    const result = getBetVoidEligibility({
      bet: makeBetRow({ status: 'PENDING' }),
      fight: makeFight({ status: 'OPEN' })
    })
    expect(result.canVoid).toBe(true)
    expect(result.blockReason).toBeNull()
  })

  it('blocks when fight is closed', () => {
    const result = getBetVoidEligibility({
      bet: makeBetRow({ status: 'PENDING' }),
      fight: makeFight({ status: 'CLOSED' })
    })
    expect(result.canVoid).toBe(false)
    expect(result.blockReason).toMatch(/closed/i)
  })

  it('blocks when fight is settled', () => {
    const result = getBetVoidEligibility({
      bet: makeBetRow({ status: 'PENDING' }),
      fight: makeFight({ status: 'SETTLED' })
    })
    expect(result.canVoid).toBe(false)
    expect(result.blockReason).toMatch(/settled/i)
  })

  it('blocks already voided tickets', () => {
    const result = getBetVoidEligibility({
      bet: makeBetRow({ status: 'VOIDED' }),
      fight: makeFight({ status: 'OPEN' })
    })
    expect(result.canVoid).toBe(false)
    expect(result.blockReason).toMatch(/voided/i)
  })

  it('blocks without fight context', () => {
    const result = getBetVoidEligibility({
      bet: makeBetRow(),
      fight: null
    })
    expect(result.canVoid).toBe(false)
  })
})
