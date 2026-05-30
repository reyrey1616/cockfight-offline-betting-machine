import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { printBetTicket } from '@/lib/print-bet-ticket'
import { makeBetRow, makeFight } from '@/test/fixtures'

vi.mock('@/lib/render-ticket-barcode', () => ({
  ticketCodeToBarcodeDataUrl: () => 'data:image/png;base64,test'
}))

describe('printBetTicket', () => {
  const openSpy = vi.spyOn(window, 'open')
  const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-slip')

  beforeEach(() => {
    openSpy.mockReset()
    delete window.electronAPI
  })

  afterEach(() => {
    delete window.electronAPI
  })

  it('uses Electron IPC when electronAPI is present', async () => {
    const printBetTicketIpc = vi.fn().mockResolvedValue({ ok: true })
    window.electronAPI = {
      isElectron: true,
      printBetTicket: printBetTicketIpc,
      printCollectorBadge: vi.fn(),
      printCashSlip: vi.fn(),
      getDesktopConfig: vi.fn()
    }

    const ok = await printBetTicket({
      response: {
        bet: makeBetRow({ code: 'XY99ZZZZ', amount: '500.00' }),
        fight: makeFight(),
        actorBalance: '1000.00'
      },
      tellerName: 'Desk One'
    })

    expect(ok).toBe(true)
    expect(printBetTicketIpc).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'XY99ZZZZ',
        amount: '500.00',
        tellerName: 'Desk One',
        barcodePngDataUrl: 'data:image/png;base64,test'
      })
    )
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('opens a blob URL print window in the browser', async () => {
    const print = vi.fn()
    const close = vi.fn()
    const listeners: Record<string, () => void> = {}

    openSpy.mockReturnValue({
      closed: false,
      focus: vi.fn(),
      print,
      close,
      addEventListener: (type: string, fn: () => void) => {
        listeners[type] = fn
      }
    } as unknown as Window)

    const ok = await printBetTicket({
      response: {
        bet: makeBetRow(),
        fight: makeFight(),
        actorBalance: '0.00'
      },
      tellerName: 'Teller'
    })

    expect(ok).toBe(true)
    expect(createObjectURL).toHaveBeenCalled()
    expect(openSpy).toHaveBeenCalledWith('blob:mock-slip', '_blank', 'width=360,height=520')

    listeners.load?.()
    await vi.waitFor(() => expect(print).toHaveBeenCalled(), { timeout: 2000 })
  })
})
