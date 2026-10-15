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
        deletePending={false}
        onEdit={vi.fn()}
        onDeleteClick={vi.fn()}
        onOpenBarcodePrint={vi.fn()}
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
        deletePending={false}
        onEdit={onEdit}
        onDeleteClick={vi.fn()}
        onOpenBarcodePrint={vi.fn()}
      />
    )

    expect(screen.getByText(teller.fullName)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalledWith(teller)
  })

  it('filters tellers by username keyword (case-insensitive)', async () => {
    const user = userEvent.setup()
    const alpha = makeAdminUser({ id: 't-a', username: 'alpha01', fullName: 'Alpha Desk' })
    const bravo = makeAdminUser({ id: 't-b', username: 'bravo02', fullName: 'Bravo Desk' })

    render(
      <TellersTable
        tellers={[alpha, bravo]}
        listLoading={false}
        isError={false}
        listMessage={undefined}
        onRefresh={vi.fn()}
        currentUserId="admin-1"
        deletePending={false}
        onEdit={vi.fn()}
        onDeleteClick={vi.fn()}
        onOpenBarcodePrint={vi.fn()}
      />
    )

    const search = screen.getByRole('searchbox', { name: /search tellers by username/i })
    await user.type(search, 'BRAVO')
    expect(screen.queryByText(alpha.fullName)).not.toBeInTheDocument()
    expect(screen.getByText(bravo.fullName)).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'zzz')
    expect(screen.getByText(/no tellers match/i)).toBeInTheDocument()
  })
})
