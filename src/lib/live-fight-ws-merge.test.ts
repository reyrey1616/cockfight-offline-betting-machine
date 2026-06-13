import { describe, expect, it } from 'vitest'

import { pickCurrentDisplayFight } from '@/lib/live-fight-ws-merge'
import { makeFight } from '@/test/fixtures'

describe('pickCurrentDisplayFight', () => {
  it('prefers the newest fight by fightNumber (not an older CLOSED row)', () => {
    const fights = [
      makeFight({
        fightNumber: 13,
        status: 'SETTLED',
        meronPool: '700.00',
        walaPool: '585.50'
      }),
      makeFight({
        fightNumber: 10,
        status: 'CLOSED',
        meronPool: '700.00',
        walaPool: '800.00'
      })
    ]
    const pick = pickCurrentDisplayFight(fights)
    expect(pick?.fightNumber).toBe(13)
    expect(pick?.meronPool).toBe('700.00')
    expect(pick?.walaPool).toBe('585.50')
  })

  it('skips cancelled and scheduled rows', () => {
    const fights = [
      makeFight({ fightNumber: 11, status: 'CANCELLED' }),
      makeFight({ fightNumber: 12, status: 'OPEN', meronPool: '100.50', walaPool: '203.25' })
    ]
    expect(pickCurrentDisplayFight(fights)?.fightNumber).toBe(12)
  })
})
