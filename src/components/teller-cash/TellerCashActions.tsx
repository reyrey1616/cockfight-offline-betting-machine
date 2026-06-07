import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/store/auth'

import { printCashSlip } from '@/lib/print-cash-slip'

import { TellerCashTransactionDialog, type CashTransactionKind } from './TellerCashTransactionDialog'

export interface TellerCashActionsProps {
  className?: string
  surface?: 'default' | 'dark'
}

/** Deposit + remittance entry points for teller surfaces. */
export function TellerCashActions({ className, surface = 'default' }: TellerCashActionsProps) {
  const user = useAuthUser()
  const [dialogKind, setDialogKind] = useState<CashTransactionKind | null>(null)

  if (user?.role !== 'TELLER') {
    return null
  }

  const isDark = surface === 'dark'
  const depositBtn = isDark
    ? 'bg-zinc-200 text-zinc-950 shadow-sm hover:bg-white hover:text-zinc-950'
    : undefined
  const remitBtn = isDark
    ? 'border-zinc-500 bg-white text-zinc-950 shadow-sm hover:bg-zinc-100 hover:text-zinc-950'
    : undefined

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={depositBtn}
          onClick={() => setDialogKind('deposit')}
        >
          Deposit
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={remitBtn}
          onClick={() => setDialogKind('remit')}
        >
          Remit
        </Button>
      </div>
      <TellerCashTransactionDialog
        kind={dialogKind}
        onClose={() => setDialogKind(null)}
        onSuccess={async ({ kind, code, balance, collectorName, amount, recordedAt, notes }) => {
          const label = kind === 'deposit' ? 'Deposit' : 'Remittance'
          let printed = false
          if (code) {
            printed = await printCashSlip({
              kind,
              code,
              amount,
              collectorName,
              tellerName: user?.fullName ?? '—',
              recordedAt,
              notes
            })
          }
          toast.success(`${label} recorded`, {
            description: code
              ? printed
                ? `Receipt ${code} printed · Balance ${balance}`
                : `Receipt ${code} — print failed · Balance ${balance}`
              : `New balance ${balance}`
          })
          if (code && !printed) {
            toast.error('Could not print cash receipt. Check printer or pop-up settings.')
          }
        }}
      />
    </>
  )
}
