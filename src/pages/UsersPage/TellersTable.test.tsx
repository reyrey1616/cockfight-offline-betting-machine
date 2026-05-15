import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TellersTable } from '@/pages/UsersPage/TellersTable'
import { makeAdminUser } from '@/test/fixtures'

describe('TellersTable', () => {
  it('shows loading state', () => {
    render(
      <TellersTable
        tellers={[]}
        listLoading
        isError={false}
        listMessage={undefined}
        onRefresh={vi.fn()}
        currentUserId="admin-1"
        patchPending={false}
        onEdit={vi.fn()}
        onDeactivateClick={vi.fn()}
        onReactivate={vi.fn()}
      />
    )
    expect(screen.getByText(/loading tellers/i)).toBeInTheDocument()
  })

  it('lists tellers and wires edit action', async () => {
    const user = userEvent.setup()
    const teller = makeAdminUser()
    const onEdit = vi.fn()

    render(
      <TellersTable
        tellers={[teller]}
        listLoading={false}
        isError={false}
        listMessage={undefined}
        onRefresh={vi.fn()}
        currentUserId="admin-1"
        patchPending={false}
        onEdit={onEdit}
        onDeactivateClick={vi.fn()}
        onReactivate={vi.fn()}
      />
    )

    expect(screen.getByText(teller.fullName)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(teller)
  })
})
