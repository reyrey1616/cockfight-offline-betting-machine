import { describe, expect, it } from 'vitest'

import { buildBetTicketSlipHtml } from '@/lib/bet-ticket-slip-html'

describe('buildBetTicketSlipHtml', () => {
  it('renders 80mm square slip with barcode, amount, and teller', () => {
    const html = buildBetTicketSlipHtml({
      code: 'AB12CD34',
      fightNumber: '12',
      bettingSide: 'Meron',
      betAmount: '1,200.00',
      tellerName: 'Joshua Castanares',
      placedAt: '2026-06-07 14:30',
      barcodePngDataUrl: 'data:image/png;base64,abc'
    })
    expect(html).toContain('80mm')
    expect(html).toContain('class="slip"')
    expect(html).toContain('data:image/png;base64,abc')
    expect(html).toContain('Bet amount:')
    expect(html).toContain('Teller:')
    expect(html).toContain('1,200.00')
    expect(html).toContain('Joshua Castanares')
    expect(html).toContain('Fight #:')
    expect(html).toContain('12')
  })
})
