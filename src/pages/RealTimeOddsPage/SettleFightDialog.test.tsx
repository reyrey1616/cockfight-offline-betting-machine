import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SettleFightDialog } from '@/pages/RealTimeOddsPage/SettleFightDialog'

describe('SettleFightDialog', () => {
  it('renders meron win copy and confirms', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <SettleFightDialog
        fightNumber={4}
        outcome="MERON"
        isPending={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByRole('heading', { name: /declare meron wins/i })).toBeInTheDocument()
    expect(screen.getByText(/Fight #4/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /save meron win/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('renders nothing without outcome', () => {
    const { container } = render(
      <SettleFightDialog
        fightNumber={4}
        outcome={null}
        isPending={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
