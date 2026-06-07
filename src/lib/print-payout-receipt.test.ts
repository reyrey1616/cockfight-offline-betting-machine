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
      bet: makeBetRow({ side: 'WALA', amount: '500.00', payoutAmount: '950.00' }),
      fight: makeFight({ fightNumber: 12 })
    })

    expect(ok).toBe(true)
    expect(printPayoutReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        fightNumber: '12',
        bettingSide: 'Wala',
        betAmount: '500.00',
        payoutAmount: '950.00'
      })
    )
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
