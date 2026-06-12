import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LoginPage } from '@/pages/LoginPage'
import { adminUser, tellerUser } from '@/test/fixtures'
import { renderWithProviders, seedAuth } from '@/test/render'

const mutate = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useLogin: () => ({
    mutate,
    isPending: false,
    error: null
  })
}))

describe('LoginPage', () => {
  it('redirects authenticated admin to dashboard', () => {
    seedAuth(adminUser)
    renderWithProviders(<LoginPage />, { route: '/login' })
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument()
  })

  it('redirects teller away from saved admin URL to kiosk', () => {
    seedAuth(tellerUser)
    renderWithProviders(<LoginPage />, {
      initialEntries: [{ pathname: '/login', state: { from: '/admin/collectors' } }]
    })
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument()
  })

  it('submits trimmed credentials', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { route: '/login' })

    await user.type(screen.getByLabelText(/username/i), '  admin  ')
    await user.type(screen.getByLabelText(/password/i), 'secret')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        username: 'admin',
        password: 'secret'
      })
    })
  })
})
