import { afterEach, describe, expect, it, vi } from 'vitest'

describe('printAdminVoidBarcode', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens a print window with slip HTML', async () => {
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

    const { printAdminVoidBarcode } = await import('@/lib/print-admin-void-barcode')
    const ok = await printAdminVoidBarcode({
      username: 'admin',
      barcodeValue: 'secret-pass',
      barcodePngDataUrl: 'data:image/png;base64,x'
    })

    expect(ok).toBe(true)
    expect(window.open).toHaveBeenCalled()
  })
})
