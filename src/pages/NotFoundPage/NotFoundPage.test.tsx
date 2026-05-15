import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NotFoundPage } from '@/pages/NotFoundPage'
import { renderWithProviders } from '@/test/render'

describe('NotFoundPage', () => {
  it('renders 404 and link home', () => {
    renderWithProviders(<NotFoundPage />)
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open app/i })).toHaveAttribute('href', '/')
  })
})
