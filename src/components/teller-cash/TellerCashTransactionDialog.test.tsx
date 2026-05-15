import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TellerCashTransactionDialog } from '@/components/teller-cash/TellerCashTransactionDialog'
import { makeCollector } from '@/test/fixtures'

const advanceMutate = vi.fn()
const remitMutate = vi.fn()

vi.mock('@/hooks/useCash', () => ({
  useCashAdvance: () => ({ mutate: advanceMutate, isPending: false }),
  useCashRemit: () => ({ mutate: remitMutate, isPending: false })
}))

vi.mock('@/hooks/useCollectors', () => ({
  useCollectorsList: () => ({
    data: { collectors: [makeCollector({ id: 'col-1', name: 'Collector A', code: 'COL-A' })] },
    isPending: false,
    isError: false
  })
}))

describe('TellerCashTransactionDialog', () => {
  it('blocks submit when form is incomplete', async () => {
    const user = userEvent.setup()
    render(<TellerCashTransactionDialog kind="deposit" onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /record deposit/i }))
    expect(screen.getByText(/select a collector/i)).toBeInTheDocument()
    expect(advanceMutate).not.toHaveBeenCalled()
  })

  it('strips non-numeric characters from amount', async () => {
    const user = userEvent.setup()
    render(<TellerCashTransactionDialog kind="deposit" onClose={vi.fn()} />)

    const amount = screen.getByLabelText(/^amount$/i)
    await user.type(amount, 'rejgher123')
    expect(amount).toHaveValue('123')
  })

  it('submits deposit when form is valid', async () => {
    const user = userEvent.setup()
    render(<TellerCashTransactionDialog kind="deposit" onClose={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText(/collector/i), 'col-1')
    await user.type(screen.getByLabelText(/^amount$/i), '500')
    await user.type(screen.getByLabelText(/confirm with your password/i), 'teller12345')
    await user.click(screen.getByRole('button', { name: /record deposit/i }))

    expect(advanceMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: 'col-1',
        amount: 500,
        password: 'teller12345'
      }),
      expect.any(Object)
    )
    expect(remitMutate).not.toHaveBeenCalled()
  })

  it('submits remittance when kind is remit', async () => {
    const user = userEvent.setup()
    render(<TellerCashTransactionDialog kind="remit" onClose={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText(/collector/i), 'col-1')
    await user.type(screen.getByLabelText(/^amount$/i), '100')
    await user.type(screen.getByLabelText(/confirm with your password/i), 'teller12345')
    await user.click(screen.getByRole('button', { name: /record remittance/i }))

    expect(remitMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        collectorId: 'col-1',
        amount: 100,
        password: 'teller12345'
      }),
      expect.any(Object)
    )
  })
})
