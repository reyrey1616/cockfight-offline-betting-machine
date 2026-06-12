import { describe, expect, it } from 'vitest'

import { betListRowFromLookup, toBetListRow } from '@/lib/bet-list-row'
import { makeBetRow } from '@/test/fixtures'

const fightSummary = {
  id: 'fight-9',
  fightNumber: 9,
  status: 'SETTLED' as const,
  meronPool: '1000.00',
  walaPool: '500.00',
  meronOdds: null,
  walaOdds: null,
  payoutRatioMeron: '1.50',
  payoutRatioWala: '2.00'
}

describe('bet-list-row', () => {
  it('merges fight summary onto a bet row', () => {
    const bet = makeBetRow({ code: 'ABCD1234', amount: '250.00' })
    const row = toBetListRow(bet, fightSummary)

    expect(row.fightNumber).toBe(9)
    expect(row.fightStatus).toBe('SETTLED')
    expect(row.payoutRatioMeron).toBe('1.50')
    expect(row.code).toBe('ABCD1234')
  })

  it('builds a list row from code lookup payload', () => {
    const bet = makeBetRow({ code: 'QKY6ULIT' })
    const row = betListRowFromLookup({ bet, fight: fightSummary })

    expect(row.code).toBe('QKY6ULIT')
    expect(row.fightNumber).toBe(9)
  })
})
