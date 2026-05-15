import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CollectorsTable } from '@/pages/CollectorsPage/CollectorsTable'
import { makeCollector } from '@/test/fixtures'

describe('CollectorsTable', () => {
  it('shows error alert', () => {
    render(
      <CollectorsTable
        collectors={[]}
        listLoading={false}
        isError
        listMessage="Server error"
        onRefresh={vi.fn()}
        deletePending={false}
        onEdit={vi.fn()}
        onDeleteClick={vi.fn()}
        onOpenBarcodePrint={vi.fn()}
      />
    )
    expect(screen.getByText(/could not load collectors/i)).toBeInTheDocument()
    expect(screen.getByText('Server error')).toBeInTheDocument()
  })

  it('opens barcode print handler', async () => {
    const user = userEvent.setup()
    const collector = makeCollector()
    const onOpenBarcodePrint = vi.fn()

    render(
      <CollectorsTable
        collectors={[collector]}
        listLoading={false}
        isError={false}
        listMessage={undefined}
        onRefresh={vi.fn()}
        deletePending={false}
        onEdit={vi.fn()}
        onDeleteClick={vi.fn()}
        onOpenBarcodePrint={onOpenBarcodePrint}
      />
    )

    await user.click(screen.getByRole('button', { name: /barcode/i }))
    expect(onOpenBarcodePrint).toHaveBeenCalledWith(collector)
  })
})
