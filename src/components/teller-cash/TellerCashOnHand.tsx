import { formatMoney } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import { useCashBalance } from '@/hooks/useCash'

export interface TellerCashOnHandProps {
  className?: string
  /** `dark` for zinc/black kiosk header bars. */
  surface?: 'default' | 'dark'
}

/** Running teller drawer balance from GET /cash/balance. */
export function TellerCashOnHand({ className, surface = 'default' }: TellerCashOnHandProps) {
  const { data, isPending, isError } = useCashBalance()
  const balance = data?.balance

  return (
    <div
      className={cn(
        'flex flex-col items-end rounded-md border px-2.5 py-1 text-right',
        surface === 'dark'
          ? 'border-zinc-600 bg-zinc-900/80'
          : 'border-border bg-muted/40',
        className
      )}
      aria-live="polite"
    >
      <span
        className={cn(
          'text-[10px] font-semibold uppercase tracking-wide',
          surface === 'dark' ? 'text-zinc-400' : 'text-muted-foreground'
        )}
      >
        Cash on hand
      </span>
      <span
        className={cn(
          'text-base font-black tabular-nums leading-tight',
          surface === 'dark' ? 'text-lime-300' : 'text-foreground'
        )}
      >
        {isPending ? '…' : isError ? '—' : formatMoney(balance ?? '0')}
      </span>
    </div>
  )
}
