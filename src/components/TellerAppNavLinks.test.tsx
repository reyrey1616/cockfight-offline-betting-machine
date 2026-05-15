import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TellerAppNavLinks } from '@/components/TellerAppNavLinks'
import { adminUser, tellerUser } from '@/test/fixtures'
import { renderWithProviders, seedAuth } from '@/test/render'

describe('TellerAppNavLinks', () => {
  it('shows payout and kiosk for teller', () => {
    seedAuth(tellerUser)
    renderWithProviders(<TellerAppNavLinks />, { route: '/payout-machine' })
    expect(screen.getByRole('link', { name: 'Payout machine' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Betting kiosk' })).toBeInTheDocument()
  })

  it('hides kiosk for admin', () => {
    seedAuth(adminUser)
    renderWithProviders(<TellerAppNavLinks />, { route: '/payout-machine' })
    expect(screen.getByRole('link', { name: 'Payout machine' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Betting kiosk' })).not.toBeInTheDocument()
  })
})
