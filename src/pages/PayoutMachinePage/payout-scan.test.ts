import { describe, expect, it } from 'vitest'

import {
  isCompleteTicketCode,
  sanitizeTicketInput,
  TICKET_CODE_MAX
} from '@/pages/PayoutMachinePage/payout-scan'

describe('payout-scan', () => {
  it('sanitizes to uppercase alphanumeric max 8', () => {
    expect(sanitizeTicketInput('qk y6u!')).toBe('QKY6U')
    expect(sanitizeTicketInput('qky6ulit9')).toBe('QKY6ULIT')
    expect(TICKET_CODE_MAX).toBe(8)
  })

  it('detects complete ticket codes', () => {
    expect(isCompleteTicketCode('QKY6ULIT')).toBe(true)
    expect(isCompleteTicketCode('QKY6U')).toBe(false)
  })
})
