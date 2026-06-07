import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { printBetTicket, reprintBetTicket } from '@/lib/print-bet-ticket'
import type { ElectronAPI } from '@/lib/electron.d'
import { makeBetRow, makeFight } from '@/test/fixtures'

vi.mock('@/lib/render-ticket-barcode', () => ({
  ticketCodeToBarcodeDataUrl: () => 'data:image/png;base64,test'
}))

function makeElectronAPI(
  overrides: Partial<ElectronAPI> & Pick<ElectronAPI, 'printBetTicket'>
): ElectronAPI {
  return {
    isElectron: true,
    printCollectorBadge: vi.fn(),
    printCashSlip: vi.fn(),
    printPayoutReceipt: vi.fn(),
    getDesktopConfig: vi.fn(),
    ...overrides
  }
}

describe('printBetTicket', () => {
  const openSpy = vi.spyOn(window, 'open')
  const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-slip')

  beforeEach(() => {
    openSpy.mockReset()
    delete window.electronAPI
  })

  afterEach(() => {
    delete window.electronAPI
    vi.clearAllMocks()
  })

  it('uses Electron IPC when electronAPI is present', async () => {
    const printBetTicketIpc = vi.fn().mockResolvedValue({ ok: true })
    window.electronAPI = makeElectronAPI({ printBetTicket: printBetTicketIpc })

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
        fightNumber: '1',
        bettingSide: 'Meron',
        betAmount: '500.00',
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

describe('reprintBetTicket', () => {
  beforeEach(() => {
    delete window.electronAPI
  })

  afterEach(() => {
    delete window.electronAPI
    vi.clearAllMocks()
  })

  it('uses Electron IPC with bet row fields', async () => {
    const printBetTicketIpc = vi.fn().mockResolvedValue({ ok: true })
    window.electronAPI = makeElectronAPI({ printBetTicket: printBetTicketIpc })

    const bet = makeBetRow({ code: 'XY99ZZZZ', amount: '500.00', side: 'WALA' })
    const ok = await reprintBetTicket({ bet, fightNumber: 12, tellerName: 'Desk One' })

    expect(ok).toBe(true)
    expect(printBetTicketIpc).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'XY99ZZZZ',
        fightNumber: '12',
        bettingSide: 'Wala',
        betAmount: '500.00',
        tellerName: 'Desk One',
        barcodePngDataUrl: 'data:image/png;base64,test'
      })
    )
  })
})
