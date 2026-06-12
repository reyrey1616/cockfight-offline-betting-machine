import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TellerBettingPanel } from '@/components/teller-betting/TellerBettingPanel'
import { makeFight } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'

const placeBetMutate = vi.fn()

vi.mock('@/hooks/usePlaceBet', () => ({
  usePlaceBet: () => ({
    mutate: placeBetMutate,
    isPending: false,
    variables: undefined
  })
}))

vi.mock('@/hooks/useCash', () => ({
  useSetCashBalance: () => vi.fn()
}))

describe('TellerBettingPanel', () => {
  it('shows locked message when no fight', () => {
    renderWithProviders(<TellerBettingPanel fight={null} />)
    expect(screen.getByText(/no active fight/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Meron' })).toBeDisabled()
  })

  it('shows locked message when fight is not OPEN', () => {
    renderWithProviders(
      <TellerBettingPanel fight={makeFight({ status: 'CLOSED', fightNumber: 5 })} />
    )
    expect(screen.getByText(/fight #5 is closed/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Meron' })).toBeDisabled()
  })

  it('strips letters from amount input', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TellerBettingPanel fight={makeFight()} />)

    const input = screen.getByLabelText(/enter amount/i)
    await user.type(input, 'abc100')
    expect(input).toHaveValue('100')
  })

  it('formats thousands while typing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TellerBettingPanel fight={makeFight()} />)

    const input = screen.getByLabelText(/enter amount/i)
    await user.type(input, '1500')
    expect(input).toHaveValue('1,500')
  })

  it('places bet on Meron when amount is valid', async () => {
    const user = userEvent.setup()
    const fight = makeFight({ id: 'fight-99' })
    renderWithProviders(<TellerBettingPanel fight={fight} />)

    await user.type(screen.getByLabelText(/enter amount/i), '200')
    await user.click(screen.getByRole('button', { name: 'Meron' }))

    await waitFor(() => {
      expect(placeBetMutate).toHaveBeenCalledWith(
        { fightId: 'fight-99', side: 'MERON', amount: 200 },
        expect.any(Object)
      )
    })
  })

  it('disables Meron when side is held', () => {
    renderWithProviders(
      <TellerBettingPanel
        fight={makeFight({ meronAcceptingBets: false, walaAcceptingBets: true })}
      />
    )
    expect(screen.getByRole('button', { name: 'Meron' })).toBeDisabled()
    expect(screen.getByText(/meron side is held/i)).toBeInTheDocument()
  })
})
