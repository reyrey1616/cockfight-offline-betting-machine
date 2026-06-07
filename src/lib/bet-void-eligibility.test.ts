import { describe, expect, it } from 'vitest'

import { getBetVoidEligibility, getBetVoidEligibilityForTeller } from '@/lib/bet-void-eligibility'
import { makeBetRow, makeFight, tellerUser } from '@/test/fixtures'

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

  it('blocks teller void when ticket belongs to another teller', () => {
    const result = getBetVoidEligibilityForTeller({
      bet: makeBetRow({ status: 'PENDING', tellerId: 'other-teller' }),
      fight: makeFight({ status: 'OPEN' }),
      tellerId: 'user-1'
    })
    expect(result.canVoid).toBe(false)
    expect(result.blockReason).toMatch(/this teller/i)
  })

  it('blocks void when ticket is on a different fight than the board', () => {
    const result = getBetVoidEligibilityForTeller({
      bet: makeBetRow({ status: 'PENDING', fightId: 'fight-old' }),
      fight: { ...makeFight({ id: 'fight-old', fightNumber: 5, status: 'OPEN' }) },
      tellerId: tellerUser.id,
      currentFight: makeFight({ id: 'fight-1', fightNumber: 7 })
    })
    expect(result.canVoid).toBe(false)
    expect(result.blockReason).toMatch(/fight #5/i)
    expect(result.blockReason).toMatch(/fight #7/i)
  })
})
