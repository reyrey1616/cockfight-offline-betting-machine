import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FightSimpleConfirmDialog } from '@/pages/RealTimeOddsPage/FightSimpleConfirmDialog'

describe('FightSimpleConfirmDialog', () => {
  it('calls onConfirm when confirm is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onClose = vi.fn()

    render(
      <FightSimpleConfirmDialog
        open
        title="Close betting?"
        description="Stops new tickets."
        confirmLabel="Close betting"
        confirmVariant="destructive"
        isPending={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Close betting' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('disables actions while pending', () => {
    render(
      <FightSimpleConfirmDialog
        open
        title="Close betting?"
        description="Stops new tickets."
        confirmLabel="Close betting"
        isPending
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
