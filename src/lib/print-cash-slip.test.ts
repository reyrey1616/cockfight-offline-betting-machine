import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ElectronAPI } from '@/lib/electron.d'

vi.mock('@/lib/render-ticket-barcode', () => ({
  cashSlipCodeToBarcodeDataUrl: () => 'data:image/png;base64,test'
}))

function makeElectronAPI(
  overrides: Partial<ElectronAPI> & Pick<ElectronAPI, 'printCashSlip'>
): ElectronAPI {
  return {
    isElectron: true,
    printBetTicket: vi.fn(),
    printCollectorBadge: vi.fn(),
    printPayoutReceipt: vi.fn(),
    getDesktopConfig: vi.fn(),
    ...overrides
  }
}

describe('printCashSlip', () => {
  afterEach(() => {
    delete window.electronAPI
    vi.restoreAllMocks()
  })

  it('uses Electron silent print when available', async () => {
    const printCashSlipIpc = vi.fn().mockResolvedValue({ ok: true })
    window.electronAPI = makeElectronAPI({ printCashSlip: printCashSlipIpc })

    const { printCashSlip } = await import('@/lib/print-cash-slip')
    const ok = await printCashSlip({
      kind: 'deposit',
      code: 'ADV12345',
      amount: '500.00',
      collectorName: 'Collector A',
      tellerName: 'Teller One',
      recordedAt: '2026-06-07T14:30:00.000Z'
    })

    expect(ok).toBe(true)
    expect(printCashSlipIpc).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'deposit',
        code: 'ADV12345',
        collectorName: 'Collector A',
        barcodePngDataUrl: 'data:image/png;base64,test'
      })
    )
  })

  it('returns false when code is missing', async () => {
    const { printCashSlip } = await import('@/lib/print-cash-slip')
    const ok = await printCashSlip({
      kind: 'remit',
      code: '',
      amount: '100',
      collectorName: 'A',
      tellerName: 'B',
      recordedAt: '2026-06-07T14:30:00.000Z'
    })
    expect(ok).toBe(false)
  })
})
