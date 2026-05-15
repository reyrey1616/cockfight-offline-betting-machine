import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SESSION_RESET_CONFIRM_TEXT } from '@/constants'
import { SessionResetDialog } from '@/pages/SettingsPage/SessionResetDialog'
import { makeSessionPreview } from '@/test/fixtures'

const runReset = vi.fn()

vi.mock('@/hooks/useSession', () => ({
  useSessionResetPreview: () => ({
    data: makeSessionPreview(),
    isLoading: false,
    isError: false,
    error: null
  }),
  useResetSession: () => ({
    mutate: runReset,
    isPending: false
  })
}))

describe('SessionResetDialog', () => {
  it('blocks submit without password and confirm text', async () => {
    const user = userEvent.setup()
    render(<SessionResetDialog open onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /reset session/i }))
    expect(screen.getByText(/enter your admin password/i)).toBeInTheDocument()
    expect(runReset).not.toHaveBeenCalled()
  })

  it('submits when form is valid', async () => {
    const user = userEvent.setup()
    render(<SessionResetDialog open onClose={vi.fn()} />)

    await user.type(screen.getByLabelText(/your password/i), 'admin2026@')
    await user.type(screen.getByLabelText(/type/i), SESSION_RESET_CONFIRM_TEXT)
    await user.click(screen.getByRole('button', { name: /reset session/i }))

    expect(runReset).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'admin2026@',
        force: false
      }),
      expect.any(Object)
    )
  })

  it('shows preview counts', () => {
    render(<SessionResetDialog open onClose={vi.fn()} />)
    expect(screen.getByText((_, el) => el?.textContent === '3')).toBeInTheDocument()
    expect(screen.getByText('fights')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('bets (tickets)')).toBeInTheDocument()
  })
})
