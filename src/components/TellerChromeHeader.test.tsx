import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TellerChromeHeader } from '@/components/TellerChromeHeader'
import { adminUser, tellerUser } from '@/test/fixtures'
import { renderWithProviders, seedAuth } from '@/test/render'

const logoutMutate = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useLogout: () => ({ mutate: logoutMutate, isPending: false })
}))

vi.mock('@/hooks/useCash', () => ({
  useCashBalance: () => ({
    data: { balance: '350.00', tellerId: tellerUser.id, username: tellerUser.username, fullName: tellerUser.fullName },
    isPending: false,
    isError: false
  }),
  useCashAdvance: () => ({ mutate: vi.fn(), isPending: false }),
  useCashRemit: () => ({ mutate: vi.fn(), isPending: false })
}))

vi.mock('@/hooks/useCollectors', () => ({
  useCollectorsList: () => ({ data: { collectors: [] }, isPending: false, isError: false })
}))

describe('TellerChromeHeader', () => {
  it('shows cash actions for teller', () => {
    seedAuth(tellerUser)
    renderWithProviders(<TellerChromeHeader />, { route: '/payout-machine' })
    expect(screen.getByText('Cash on hand')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deposit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remit' })).toBeInTheDocument()
    expect(screen.getByText('Teller')).toBeInTheDocument()
  })

  it('hides cash actions for admin on payout machine', () => {
    seedAuth(adminUser)
    renderWithProviders(<TellerChromeHeader />, { route: '/payout-machine' })
    expect(screen.queryByText('Cash on hand')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deposit' })).not.toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('calls logout when Sign out is clicked', async () => {
    const user = userEvent.setup()
    seedAuth(tellerUser)
    renderWithProviders(<TellerChromeHeader />, { route: '/kiosk' })

    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(logoutMutate).toHaveBeenCalled()
  })

  it('renders trailing slot', () => {
    seedAuth(tellerUser)
    renderWithProviders(
      <TellerChromeHeader trailing={<span data-testid="live-status">Live</span>} />,
      { route: '/kiosk' }
    )
    expect(screen.getByTestId('live-status')).toBeInTheDocument()
  })
})
