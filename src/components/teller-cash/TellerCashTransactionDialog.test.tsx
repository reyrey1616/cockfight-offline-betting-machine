import { render, screen, waitFor } from '@testing-library/react'
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

const collector = makeCollector({ id: 'col-1', name: 'Collector A', code: 'COLABCDE' })

vi.mock('@/hooks/useCollectors', () => ({
  useCollectorByCode: (rawCode: string) => {
    const code = rawCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (code.length !== 8 || !code.startsWith('COL')) {
      return { data: undefined, isFetching: false, isError: false, error: null }
    }
    if (code === collector.code) {
      return {
        data: { collector },
        isFetching: false,
        isError: false,
        error: null
      }
    }
    return {
      data: undefined,
      isFetching: false,
      isError: true,
      error: new Error('No collector matches that code')
    }
  }
}))

describe('TellerCashTransactionDialog', () => {
  it('blocks submit when collector is not scanned', async () => {
    const user = userEvent.setup()
    render(<TellerCashTransactionDialog kind="deposit" onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /record deposit/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/scan the collector badge/i)
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

    await user.type(screen.getByLabelText(/collector \(scan badge\)/i), collector.code)
    await user.type(screen.getByLabelText(/^amount$/i), '500')
    await user.click(screen.getByRole('button', { name: /record deposit/i }))

    await waitFor(() => {
      expect(advanceMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorCode: collector.code,
          amount: 500
        }),
        expect.any(Object)
      )
    })
    expect(remitMutate).not.toHaveBeenCalled()
  })

  it('submits remittance when kind is remit', async () => {
    const user = userEvent.setup()
    render(<TellerCashTransactionDialog kind="remit" onClose={vi.fn()} />)

    await user.type(screen.getByLabelText(/collector \(scan badge\)/i), collector.code)
    await user.type(screen.getByLabelText(/^amount$/i), '100')
    await user.click(screen.getByRole('button', { name: /record remittance/i }))

    await waitFor(() => {
      expect(remitMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorCode: collector.code,
          amount: 100
        }),
        expect.any(Object)
      )
    })
  })
})
