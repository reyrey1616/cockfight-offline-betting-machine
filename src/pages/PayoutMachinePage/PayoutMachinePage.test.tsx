import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PayoutMachinePage } from '@/pages/PayoutMachinePage'
import { makeBetRow, makeFight } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'

vi.mock('@/lib/api-bets', () => ({
  getBetByCode: vi.fn(),
  payBet: vi.fn()
}))

vi.mock('@/hooks/useCash', () => ({
  useSetCashBalance: () => vi.fn()
}))

import { getBetByCode } from '@/lib/api-bets'

const mockGetBetByCode = vi.mocked(getBetByCode)

describe('PayoutMachinePage', () => {
  it('looks up ticket automatically when 8 characters are entered', async () => {
    const user = userEvent.setup()
    mockGetBetByCode.mockResolvedValue({
      bet: makeBetRow({
        code: 'QKY6ULIT',
        status: 'WON',
        payoutAmount: '270.00',
        side: 'WALA'
      }),
      fight: {
        id: 'fight-1',
        fightNumber: 12,
        status: 'SETTLED',
        outcome: 'WALA',
        meronPool: '300.00',
        walaPool: '200.00',
        meronOdds: 1.6,
        walaOdds: 2.35,
        payoutRatioMeron: null,
        payoutRatioWala: '1.3500'
      }
    })

    renderWithProviders(<PayoutMachinePage />)

    const input = screen.getByLabelText(/reference code/i)
    await user.type(input, 'QKY6ULIT')

    await waitFor(() => {
      expect(mockGetBetByCode).toHaveBeenCalledWith('QKY6ULIT')
    })
    expect(await screen.findByText(/pay customer/i)).toBeInTheDocument()
  })
})
