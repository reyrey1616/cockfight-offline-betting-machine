import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TellerBettingHistory } from '@/components/teller-betting/TellerBettingHistory'
import { makeBetRow, makeFight } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'

const voidMutate = vi.fn()

vi.mock('@/lib/api-bets', () => ({
  listBets: vi.fn()
}))

vi.mock('@/hooks/useVoidBet', () => ({
  useVoidBet: () => ({
    mutate: voidMutate,
    isPending: false
  })
}))

vi.mock('@/hooks/useCash', () => ({
  useSetCashBalance: () => vi.fn()
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

  it('enables cancel for pending bet on open fight', async () => {
    const user = userEvent.setup()
    mockListBets.mockResolvedValue({
      bets: [makeBetRow({ id: 'bet-void-1', code: 'TKT99999', status: 'PENDING' })],
      nextCursor: null
    })

    renderWithProviders(<TellerBettingHistory fight={makeFight({ status: 'OPEN' })} />)

    const cancelBtn = await screen.findByRole('button', { name: 'Cancel' })
    expect(cancelBtn).toBeEnabled()

    await user.click(cancelBtn)
    expect(screen.getByRole('heading', { name: /cancel ticket/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^cancel ticket$/i }))
    await waitFor(() => {
      expect(voidMutate).toHaveBeenCalledWith(
        { betId: 'bet-void-1', body: {} },
        expect.any(Object)
      )
    })
  })

  it('omits cancel action when fight is closed', async () => {
    mockListBets.mockResolvedValue({
      bets: [makeBetRow({ status: 'PENDING' })],
      nextCursor: null
    })

    renderWithProviders(<TellerBettingHistory fight={makeFight({ status: 'CLOSED' })} />)

    await screen.findByText(/pending/i)
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Action' })).not.toBeInTheDocument()
  })

  it('leaves action cell empty when cancel is not allowed', async () => {
    mockListBets.mockResolvedValue({
      bets: [makeBetRow({ status: 'VOIDED' })],
      nextCursor: null
    })

    renderWithProviders(<TellerBettingHistory fight={makeFight()} />)

    await screen.findByText(/voided/i)
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('shows action header when open fight has cancellable tickets', async () => {
    mockListBets.mockResolvedValue({
      bets: [makeBetRow({ status: 'PENDING' })],
      nextCursor: null
    })

    renderWithProviders(<TellerBettingHistory fight={makeFight({ status: 'OPEN' })} />)

    expect(await screen.findByRole('columnheader', { name: 'Action' })).toBeInTheDocument()
    expect(screen.getByText(/pending tickets can be cancelled/i)).toBeInTheDocument()
  })
})
