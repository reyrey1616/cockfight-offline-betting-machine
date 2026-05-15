import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SideNav } from '@/components/SideNav'
import { adminUser } from '@/test/fixtures'
import { renderWithProviders, seedAuth } from '@/test/render'

describe('SideNav', () => {
  it('renders admin navigation links', () => {
    seedAuth(adminUser)
    renderWithProviders(<SideNav />, { route: '/dashboard' })
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Tellers' })).toHaveAttribute('href', '/admin/tellers')
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/admin/settings'
    )
  })

  it('renders nothing when not signed in', () => {
    const { container } = render(<SideNav />)
    expect(container.querySelector('a')).toBeNull()
  })
})
