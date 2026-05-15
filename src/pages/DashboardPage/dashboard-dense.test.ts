import { describe, expect, it } from 'vitest'

import { fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'

describe('fmtWhenShort', () => {
  it('formats ISO timestamps', () => {
    const out = fmtWhenShort('2026-05-15T14:30:00.000Z')
    expect(out).toMatch(/\d/)
    expect(out).not.toBe('2026-05-15T14:30:00.000Z')
  })

  it('returns a fallback string when date is invalid', () => {
    const out = fmtWhenShort('not-a-date')
    expect(out).not.toBe('')
    expect(out).not.toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
