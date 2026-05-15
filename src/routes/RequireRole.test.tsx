import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RequireRole } from '@/routes/RequireRole'
import { adminUser, tellerUser } from '@/test/fixtures'
import { renderWithProviders, seedAuth } from '@/test/render'

describe('RequireRole', () => {
  it('renders children when role is allowed', () => {
    seedAuth(adminUser)
    renderWithProviders(
      <RequireRole allow={['ADMIN']}>
        <p>Secret admin</p>
      </RequireRole>
    )
    expect(screen.getByText('Secret admin')).toBeInTheDocument()
  })

  it('redirects teller away from admin-only route', () => {
    seedAuth(tellerUser)
    renderWithProviders(
      <RequireRole allow={['ADMIN']}>
        <p>Secret admin</p>
      </RequireRole>,
      { route: '/admin/settings' }
    )
    expect(screen.queryByText('Secret admin')).not.toBeInTheDocument()
  })
})
