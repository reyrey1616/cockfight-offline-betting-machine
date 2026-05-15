import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SessionResetSection } from '@/pages/SettingsPage/SessionResetSection'
import { makeSessionResetRow } from '@/test/fixtures'

vi.mock('@/pages/SettingsPage/SessionResetDialog', () => ({
  SessionResetDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="reset-dialog">dialog open</div> : null
}))

vi.mock('@/hooks/useSession', () => ({
  useSessionResets: () => ({
    data: { resets: [makeSessionResetRow()] },
    isPending: false
  })
}))

describe('SessionResetSection', () => {
  it('lists recent resets and opens dialog', async () => {
    const user = userEvent.setup()
    render(<SessionResetSection />)

    expect(screen.getByText(/session reset/i)).toBeInTheDocument()
    expect(screen.getByText(/5 fights, 12 bets/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /reset session/i }))
    expect(screen.getByTestId('reset-dialog')).toBeInTheDocument()
  })
})
