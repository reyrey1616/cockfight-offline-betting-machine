import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BET_SIDE_LABEL, BET_STATUS_LABEL } from '@/constants'
import { fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'
import { listBets } from '@/lib/api-bets'
import { formatMoney } from '@/lib/format-money'
import { tellerBetHistoryQueryKey } from '@/lib/teller-bets-query-keys'
import { cn } from '@/lib/utils'
import type { BetRow, Fight } from '@/types/api'

export interface TellerBettingHistoryProps {
  fight: Fight | null
  className?: string
}

function sidePillClass(side: BetRow['side']): string {
  return side === 'MERON'
    ? 'bg-red-600/15 text-red-800 dark:text-red-200'
    : 'bg-blue-600/15 text-blue-800 dark:text-blue-200'
}

/**
 * Recent tickets for the signed-in teller (`GET /bets` is server-scoped).
 * When a fight is on screen, lists bets for that fight; otherwise last few
 * tickets across fights.
 */
export function TellerBettingHistory({ fight, className }: TellerBettingHistoryProps) {
  const fightId = fight?.id ?? null

  const q = useQuery({
    queryKey: tellerBetHistoryQueryKey(fightId),
    queryFn: () =>
      listBets(
        fightId != null
          ? { fightId, limit: 80 }
          : { limit: 30 }
      ),
    staleTime: 4_000
  })

  const bets = q.data?.bets ?? []

  return (
    <Card className={cn('border-2 border-zinc-200 shadow-sm', className)}>
      <CardHeader className="border-b bg-muted/30 py-3">
        <CardTitle className="text-base font-bold tracking-tight">Betting history</CardTitle>
        <p className="text-xs text-muted-foreground">
          {fight == null
            ? 'Your most recent tickets (any fight).'
            : `Tickets you placed on fight #${fight.fightNumber}.`}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[min(40dvh,22rem)] overflow-y-auto">
          {q.isLoading ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">Loading…</p>
          ) : q.isError ? (
            <p className="px-4 py-8 text-center text-xs text-destructive">Could not load history.</p>
          ) : bets.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              No tickets yet{fightId ? ' for this fight.' : '.'}
            </p>
          ) : (
            <ul className="divide-y divide-border/70">
              {bets.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-xs"
                >
                  <span className="font-mono text-[11px] font-semibold text-foreground">
                    {b.code}
                  </span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      sidePillClass(b.side)
                    )}
                  >
                    {BET_SIDE_LABEL[b.side]}
                  </span>
                  <span className="ml-auto tabular-nums font-semibold text-foreground">
                    {formatMoney(b.amount)}
                  </span>
                  <span className="w-full text-[10px] text-muted-foreground sm:w-auto sm:ml-0">
                    {BET_STATUS_LABEL[b.status] ?? b.status} · {fmtWhenShort(b.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
