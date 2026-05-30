import { afterEach, describe, expect, it, vi } from 'vitest'

import { makeCollector } from '@/test/fixtures'

describe('printCollectorBadge', () => {
  afterEach(() => {
    delete window.electronAPI
    vi.restoreAllMocks()
  })

  it('uses Electron silent print when available', async () => {
    const printCollectorBadge = vi.fn().mockResolvedValue({ ok: true })
    window.electronAPI = {
      isElectron: true,
      printBetTicket: vi.fn(),
      printCollectorBadge,
      getDesktopConfig: vi.fn()
    }

    const collector = makeCollector({ name: 'A', code: 'COL-TEST1' })
    const { printCollectorBadge: printFn } = await import('@/lib/print-collector-badge')
    const ok = await printFn({
      collector,
      barcodePngDataUrl: 'data:image/png;base64,x'
    })

    expect(ok).toBe(true)
    expect(printCollectorBadge).toHaveBeenCalledWith({
      name: 'A',
      code: 'COL-TEST1',
      barcodePngDataUrl: 'data:image/png;base64,x'
    })
  })
})
