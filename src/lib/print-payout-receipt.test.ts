import { afterEach, describe, expect, it, vi } from 'vitest'

import { makeBetRow, makeFight } from '@/test/fixtures'

describe('printPayoutReceipt', () => {
  afterEach(() => {
    delete window.electronAPI
    vi.restoreAllMocks()
  })

  it('uses Electron silent print when available', async () => {
    const printPayoutReceipt = vi.fn().mockResolvedValue({ ok: true })
    window.electronAPI = {
      isElectron: true,
      printBetTicket: vi.fn(),
      printCollectorBadge: vi.fn(),
      printCashSlip: vi.fn(),
      printPayoutReceipt,
      getDesktopConfig: vi.fn()
    }

    const { printPayoutReceipt: printFn } = await import('@/lib/print-payout-receipt')
    const ok = await printFn({
      bet: makeBetRow({
        side: 'WALA',
        amount: '500.00',
        payoutAmount: '950.00',
        tellerNameSnapshot: 'Joshua Castanares'
      }),
      fight: makeFight({ fightNumber: 12, payoutRatioWala: '1.9000' })
    })

    expect(ok).toBe(true)
    expect(printPayoutReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('Payout receipt')
      })
    )
    expect(printPayoutReceipt.mock.calls[0][0].html).toContain('Fight number:')
    expect(printPayoutReceipt.mock.calls[0][0].html).toContain('Teller:')
    expect(printPayoutReceipt.mock.calls[0][0].html).toContain('Joshua Castanares')
    expect(printPayoutReceipt.mock.calls[0][0].html).toContain('Odds:')
    expect(printPayoutReceipt.mock.calls[0][0].html).toContain('190.00')
    expect(printPayoutReceipt.mock.calls[0][0].html).toContain('Date &amp; time:')
    expect(printPayoutReceipt.mock.calls[0][0].html).toContain('950.00')
  })

  it('prints refund status on draw/cancel refund receipts', async () => {
    const printPayoutReceipt = vi.fn().mockResolvedValue({ ok: true })
    window.electronAPI = {
      isElectron: true,
      printBetTicket: vi.fn(),
      printCollectorBadge: vi.fn(),
      printCashSlip: vi.fn(),
      printPayoutReceipt,
      getDesktopConfig: vi.fn()
    }

    const { printPayoutReceipt: printFn } = await import('@/lib/print-payout-receipt')
    const ok = await printFn({
      bet: makeBetRow({
        status: 'PENDING_REFUND',
        amount: '500.00',
        payoutAmount: '500.00'
      }),
      fight: makeFight({ fightNumber: 12, outcome: 'DRAW', status: 'SETTLED' })
    })

    expect(ok).toBe(true)
    const html = printPayoutReceipt.mock.calls[0][0].html as string
    expect(html).toContain('Status:')
    expect(html).toContain('Refunded')
    expect(html).toContain('500.00')
  })

  it('opens a print window in the browser', async () => {
    const print = vi.fn()
    const close = vi.fn()
    const addEventListener = vi.fn((event: string, handler: () => void) => {
      if (event === 'load') {
        window.setTimeout(handler, 0)
      }
    })

    vi.spyOn(window, 'open').mockReturnValue({
      closed: false,
      focus: vi.fn(),
      print,
      close,
      addEventListener
    } as unknown as Window)

    const { printPayoutReceipt } = await import('@/lib/print-payout-receipt')
    const ok = await printPayoutReceipt({
      bet: makeBetRow(),
      fight: makeFight()
    })

    expect(ok).toBe(true)
    expect(window.open).toHaveBeenCalled()
  })
})
