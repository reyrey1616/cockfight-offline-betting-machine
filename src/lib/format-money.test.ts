import { describe, expect, it } from 'vitest'

import { formatMoney } from '@/lib/format-money'

describe('formatMoney', () => {
  it('formats decimal strings with two fraction digits', () => {
    const formatted = formatMoney('1234.5')
    expect(formatted).toMatch(/1,234\.50|1\.234,50/)
  })

  it('returns original string when not numeric', () => {
    expect(formatMoney('n/a')).toBe('n/a')
  })
})
