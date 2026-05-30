import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/render-ticket-barcode', () => ({
  ticketCodeToBarcodeDataUrl: () => 'data:image/png;base64,test'
}))

describe('printCashSlip', () => {
  afterEach(() => {
    delete window.electronAPI
    vi.restoreAllMocks()
  })

  it('uses Electron silent print when available', async () => {
    const printCashSlipIpc = vi.fn().mockResolvedValue({ ok: true })
    window.electronAPI = {
      isElectron: true,
      printBetTicket: vi.fn(),
      printCollectorBadge: vi.fn(),
      printCashSlip: printCashSlipIpc,
      getDesktopConfig: vi.fn()
    }

    const { printCashSlip } = await import('@/lib/print-cash-slip')
    const ok = await printCashSlip({
      kind: 'deposit',
      code: 'ADV12345',
      amount: '500.00',
      collectorName: 'Collector A',
      tellerName: 'Teller One'
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
      tellerName: 'B'
    })
    expect(ok).toBe(false)
  })
})
