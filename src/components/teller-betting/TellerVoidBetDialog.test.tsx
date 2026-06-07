import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TellerVoidBetDialog } from '@/components/teller-betting/TellerVoidBetDialog'
import { makeBetRow } from '@/test/fixtures'

describe('TellerVoidBetDialog', () => {
  it('renders nothing when bet is null', () => {
    const { container } = render(
      <TellerVoidBetDialog
        bet={null}
        fightNumber={1}
        pending={false}
        authError={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows ticket details and confirms with admin password scan', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const bet = makeBetRow({ code: 'TKT12345', side: 'WALA', amount: '150.00' })

    render(
      <TellerVoidBetDialog
        bet={bet}
        fightNumber={7}
        pending={false}
        authError={null}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByRole('heading', { name: /cancel ticket/i })).toBeInTheDocument()
    expect(screen.getByText('TKT12345')).toBeInTheDocument()
    expect(screen.getByText(/fight #7/i)).toBeInTheDocument()

    const adminInput = screen.getByLabelText(/admin authorization/i)

    await user.type(adminInput, 'admin2026@')
    await user.click(screen.getByRole('button', { name: /cancel ticket/i }))

    expect(onConfirm).toHaveBeenCalledWith('admin2026@')
  })

  it('shows auth error from failed admin scan', () => {
    render(
      <TellerVoidBetDialog
        bet={makeBetRow()}
        fightNumber={1}
        pending={false}
        authError="Admin authorization failed"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByText(/admin authorization failed/i)).toBeInTheDocument()
  })
})
