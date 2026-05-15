import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TellerCashOnHand } from '@/components/teller-cash/TellerCashOnHand'
import { makeCashBalance } from '@/test/fixtures'

vi.mock('@/hooks/useCash', () => ({
  useCashBalance: vi.fn()
}))

import { useCashBalance } from '@/hooks/useCash'

const mockUseCashBalance = vi.mocked(useCashBalance)

describe('TellerCashOnHand', () => {
  it('shows formatted balance when loaded', () => {
    mockUseCashBalance.mockReturnValue({
      data: makeCashBalance({ balance: '350.00' }),
      isPending: false,
      isError: false
    } as ReturnType<typeof useCashBalance>)

    render(<TellerCashOnHand />)
    expect(screen.getByText('Cash on hand')).toBeInTheDocument()
    expect(screen.getByText(/350\.00/)).toBeInTheDocument()
  })

  it('shows ellipsis while loading', () => {
    mockUseCashBalance.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false
    } as ReturnType<typeof useCashBalance>)

    render(<TellerCashOnHand />)
    expect(screen.getByText('…')).toBeInTheDocument()
  })

  it('shows dash on error', () => {
    mockUseCashBalance.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true
    } as ReturnType<typeof useCashBalance>)

    render(<TellerCashOnHand />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
