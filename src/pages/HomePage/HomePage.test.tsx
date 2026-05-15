import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HomePage } from '@/pages/HomePage'
import { adminUser } from '@/test/fixtures'
import { renderWithProviders, seedAuth } from '@/test/render'

describe('HomePage', () => {
  it('greets signed-in user with role', () => {
    seedAuth(adminUser)
    renderWithProviders(<HomePage />)
    expect(screen.getByText(/Welcome, House Admin/i)).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })
})
