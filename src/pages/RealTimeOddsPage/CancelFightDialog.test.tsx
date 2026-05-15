import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CancelFightDialog } from '@/pages/RealTimeOddsPage/CancelFightDialog'

describe('CancelFightDialog', () => {
  it('passes optional reason on confirm', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <CancelFightDialog
        open
        fightNumber={12}
        isPending={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )

    expect(screen.getByRole('heading', { name: /cancel fight #12/i })).toBeInTheDocument()
    await user.type(screen.getByLabelText(/reason/i), '  rain delay  ')
    await user.click(screen.getByRole('button', { name: /cancel fight/i }))
    expect(onConfirm).toHaveBeenCalledWith('rain delay')
  })
})
