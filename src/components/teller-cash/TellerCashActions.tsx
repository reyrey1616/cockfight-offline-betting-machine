import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/store/auth'

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
        onSuccess={({ kind, code, balance }) => {
          const label = kind === 'deposit' ? 'Deposit' : 'Remittance'
          toast.success(`${label} recorded`, {
            description: code
              ? `Receipt ${code} · Balance ${balance}`
              : `New balance ${balance}`
          })
        }}
      />
    </>
  )
}
