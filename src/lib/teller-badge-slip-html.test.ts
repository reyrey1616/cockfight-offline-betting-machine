import { describe, expect, it } from 'vitest'

import { buildTellerBadgeSlipHtml } from '@/lib/teller-badge-slip-html'

describe('buildTellerBadgeSlipHtml', () => {
  it('includes teller name, username, and barcode image', () => {
    const html = buildTellerBadgeSlipHtml({
      fullName: 'Ana Reyes',
      username: 'tel001',
      initials: 'TEL',
      barcodePngDataUrl: 'data:image/png;base64,abc'
    })

    expect(html).toContain('Ana Reyes')
    expect(html).toContain('tel001')
    expect(html).toContain('TEL')
    expect(html).toContain('data:image/png;base64,abc')
  })
})
