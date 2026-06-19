import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TellerBettingHistory } from '@/components/teller-betting/TellerBettingHistory'
import { makeBetListRow, makeBetRow, makeFight, tellerUser } from '@/test/fixtures'
import { renderWithProviders, seedAuth } from '@/test/render'

const voidMutate = vi.fn()

vi.mock('@/lib/api-bets', () => ({
  listBets: vi.fn(),
  getBetByCode: vi.fn()
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

const reprintBetTicket = vi.fn()

vi.mock('@/lib/print-bet-ticket', () => ({
  reprintBetTicket: (...args: unknown[]) => reprintBetTicket(...args)
}))

import { getBetByCode, listBets } from '@/lib/api-bets'

const mockListBets = vi.mocked(listBets)
const mockGetBetByCode = vi.mocked(getBetByCode)

const openFightSummary = {
  id: 'fight-1',
  fightNumber: 7,
  status: 'OPEN' as const,
  meronPool: '0',
  walaPool: '0',
  meronOdds: null,
  walaOdds: null,
  payoutRatioMeron: null,
  payoutRatioWala: null
}

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
      bets: [makeBetListRow({ code: 'TKT00001', amount: '250.00' })],
      nextCursor: null
    })

    renderWithProviders(<TellerBettingHistory fight={makeFight()} />)

    expect(await screen.findByText('TKT00001')).toBeInTheDocument()
    expect(screen.getByText(/250\.00/)).toBeInTheDocument()
  })

  it('opens admin auth dialog after scanning a cancellable ticket', async () => {
    const user = userEvent.setup()
    mockListBets.mockResolvedValue({
      bets: [makeBetListRow({ id: 'bet-void-1', code: 'TKT99999', status: 'PENDING' })],
      nextCursor: null
    })
    mockGetBetByCode.mockResolvedValue({
      bet: makeBetRow({ id: 'bet-void-1', code: 'TKT99999', status: 'PENDING', tellerId: tellerUser.id }),
      fight: openFightSummary
    })

    seedAuth(tellerUser)
    renderWithProviders(<TellerBettingHistory fight={makeFight({ status: 'OPEN' })} />)

    await screen.findByText('TKT99999')
    const scanInput = screen.getByLabelText(/cancel ticket/i)
    await user.type(scanInput, 'tkt99999')

    expect(await screen.findByRole('heading', { name: /cancel ticket/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/admin authorization/i)).toBeInTheDocument()
  })

  it('voids ticket after admin barcode scan', async () => {
    const user = userEvent.setup()
    mockListBets.mockResolvedValue({
      bets: [makeBetListRow({ id: 'bet-void-1', code: 'TKT99999', status: 'PENDING' })],
      nextCursor: null
    })
    mockGetBetByCode.mockResolvedValue({
      bet: makeBetRow({ id: 'bet-void-1', code: 'TKT99999', status: 'PENDING', tellerId: tellerUser.id }),
      fight: openFightSummary
    })

    seedAuth(tellerUser)
    renderWithProviders(<TellerBettingHistory fight={makeFight({ status: 'OPEN' })} />)

    await user.type(screen.getByLabelText(/cancel ticket/i), 'TKT99999')
    await screen.findByRole('heading', { name: /cancel ticket/i })

    await user.type(screen.getByLabelText(/admin authorization/i), '$$$$$$$$$')
    await user.click(screen.getByRole('button', { name: /^cancel ticket$/i }))

    await waitFor(() => {
      expect(voidMutate).toHaveBeenCalledWith(
        { betId: 'bet-void-1', body: { adminPassword: '$$$$$$$$$' } },
        expect.any(Object)
      )
    })
  })

  it('does not show per-row cancel buttons', async () => {
    mockListBets.mockResolvedValue({
      bets: [makeBetListRow({ status: 'PENDING' })],
      nextCursor: null
    })

    renderWithProviders(<TellerBettingHistory fight={makeFight({ status: 'OPEN' })} />)

    await screen.findByText(/pending/i)
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/cancel ticket/i)).toBeInTheDocument()
  })

  it('shows scan input when fight is closed', async () => {
    mockListBets.mockResolvedValue({
      bets: [makeBetListRow({ status: 'PENDING' })],
      nextCursor: null
    })

    renderWithProviders(<TellerBettingHistory fight={makeFight({ status: 'CLOSED' })} />)

    await screen.findByText(/pending/i)
    expect(screen.getByLabelText(/cancel ticket/i)).toBeInTheDocument()
  })

  it('reprints a ticket from history', async () => {
    const user = userEvent.setup()
    reprintBetTicket.mockResolvedValue(true)
    const bet = makeBetListRow({ id: 'bet-reprint', code: 'TKT00001' })
    mockListBets.mockResolvedValue({ bets: [bet], nextCursor: null })

    seedAuth(tellerUser)
    renderWithProviders(<TellerBettingHistory fight={makeFight({ fightNumber: 9 })} />)

    await user.click(await screen.findByRole('button', { name: 'Reprint' }))

    await waitFor(() => {
      expect(reprintBetTicket).toHaveBeenCalledWith({
        bet,
        fightNumber: 9,
        tellerName: tellerUser.fullName
      })
    })
  })
})
