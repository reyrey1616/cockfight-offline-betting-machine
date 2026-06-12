import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ElectronAPI } from '@/lib/electron.d'
import { makeCollector } from '@/test/fixtures'

function makeElectronAPI(
  overrides: Partial<ElectronAPI> & Pick<ElectronAPI, 'printCollectorBadge'>
): ElectronAPI {
  return {
    isElectron: true,
    printBetTicket: vi.fn(),
    printCashSlip: vi.fn(),
    printPayoutReceipt: vi.fn(),
    getDesktopConfig: vi.fn(),
    ...overrides
  }
}

describe('printCollectorBadge', () => {
  afterEach(() => {
    delete window.electronAPI
    vi.restoreAllMocks()
  })

  it('uses Electron silent print when available', async () => {
    const printCollectorBadge = vi.fn().mockResolvedValue({ ok: true })
    window.electronAPI = makeElectronAPI({ printCollectorBadge })

    const collector = makeCollector({ name: 'A', code: 'COL-TEST1' })
    const { printCollectorBadge: printFn } = await import('@/lib/print-collector-badge')
    const ok = await printFn({
      collector,
      barcodePngDataUrl: 'data:image/png;base64,x'
    })

    expect(ok).toBe(true)
    expect(printCollectorBadge).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('COL-TEST1')
      })
    )
    expect(printCollectorBadge.mock.calls[0][0].html).toContain('class="barcode-code"')
  })
})
