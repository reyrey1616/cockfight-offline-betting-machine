import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TellerCashActions } from '@/components/teller-cash/TellerCashActions'
import { adminUser, makeCollector, tellerUser } from '@/test/fixtures'
import { renderWithProviders, seedAuth } from '@/test/render'

vi.mock('@/hooks/useCash', () => ({
  useCashAdvance: () => ({ mutate: vi.fn(), isPending: false }),
  useCashRemit: () => ({ mutate: vi.fn(), isPending: false })
}))

vi.mock('@/hooks/useCollectors', () => ({
  useCollectorsList: () => ({
    data: { collectors: [makeCollector()] },
    isPending: false,
    isError: false
  })
}))

describe('TellerCashActions', () => {
  it('renders deposit and remit for teller', () => {
    seedAuth(tellerUser)
    renderWithProviders(<TellerCashActions />)
    expect(screen.getByRole('button', { name: 'Deposit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remit' })).toBeInTheDocument()
  })

  it('renders nothing for admin', () => {
    seedAuth(adminUser)
    const { container } = renderWithProviders(<TellerCashActions />)
    expect(container).toBeEmptyDOMElement()
  })

  it('opens deposit dialog when Deposit is clicked', async () => {
    const user = userEvent.setup()
    seedAuth(tellerUser)
    renderWithProviders(<TellerCashActions />)

    await user.click(screen.getByRole('button', { name: 'Deposit' }))
    expect(screen.getByRole('heading', { name: 'Record deposit' })).toBeInTheDocument()
  })
})
