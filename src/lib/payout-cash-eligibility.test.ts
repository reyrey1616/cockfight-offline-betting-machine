import { describe, expect, it } from 'vitest'

import {
  canPayFromCashOnHand,
  checkPayoutCashOnHand,
  payoutCashShortfallMessage
} from '@/lib/payout-cash-eligibility'

describe('payout-cash-eligibility', () => {
  it('allows payout when balance covers amount', () => {
    expect(canPayFromCashOnHand('500.00', '270.00')).toBe(true)
    expect(checkPayoutCashOnHand('500.00', '270.00').ok).toBe(true)
  })

  it('blocks payout when cash on hand is short', () => {
    expect(canPayFromCashOnHand('100.00', '270.00')).toBe(false)
    const check = checkPayoutCashOnHand('100.00', '270.00')
    expect(check.ok).toBe(false)
    expect(check.message).toMatch(/cash on hand is short/i)
  })

  it('formats shortfall message', () => {
    expect(payoutCashShortfallMessage('100.00', '270.00')).toContain('100.00')
    expect(payoutCashShortfallMessage('100.00', '270.00')).toContain('270.00')
  })
})
