import { describe, expect, it } from 'vitest'

import { buildCollectorBadgeSlipHtml } from '@/lib/collector-badge-slip-html'

describe('buildCollectorBadgeSlipHtml', () => {
  it('includes collector name, code, and barcode image', () => {
    const html = buildCollectorBadgeSlipHtml({
      name: 'Juan Collector',
      code: 'COL-ABC12',
      barcodePngDataUrl: 'data:image/png;base64,abc'
    })
    expect(html).toContain('Juan Collector')
    expect(html).toContain('COL-ABC12')
    expect(html).toContain('data:image/png;base64,abc')
    expect(html).toContain('Collector:')
    expect(html).toContain('class="barcode-code"')
    expect(html).toContain('72mm')
  })
})
