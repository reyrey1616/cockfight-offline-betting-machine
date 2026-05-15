import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TellerBettingHistory } from '@/components/teller-betting/TellerBettingHistory'
import { makeBetRow, makeFight } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'

vi.mock('@/lib/api-bets', () => ({
  listBets: vi.fn()
}))

import { listBets } from '@/lib/api-bets'

const mockListBets = vi.mocked(listBets)

describe('TellerBettingHistory', () => {
  it('shows empty state for fight with no tickets', async () => {
    mockListBets.mockResolvedValue({ bets: [], nextCursor: null })
    const fight = makeFight({ id: 'fight-1', fightNumber: 3 })

    renderWithProviders(<TellerBettingHistory fight={fight} />)

    expect(await screen.findByText(/no tickets yet for this fight/i)).toBeInTheDocument()
    expect(mockListBets).toHaveBeenCalledWith({ fightId: 'fight-1', limit: 80 })
  })

  it('lists bet codes when data is loaded', async () => {
    mockListBets.mockResolvedValue({
      bets: [makeBetRow({ code: 'TKT00001', amount: '250.00' })],
      nextCursor: null
    })

    renderWithProviders(<TellerBettingHistory fight={makeFight()} />)

    expect(await screen.findByText('TKT00001')).toBeInTheDocument()
    expect(screen.getByText(/250\.00/)).toBeInTheDocument()
  })

  it('scopes copy to current fight number', () => {
    mockListBets.mockResolvedValue({ bets: [], nextCursor: null })
    renderWithProviders(<TellerBettingHistory fight={makeFight({ fightNumber: 11 })} />)
    expect(screen.getByText(/fight #11/i)).toBeInTheDocument()
  })
})
