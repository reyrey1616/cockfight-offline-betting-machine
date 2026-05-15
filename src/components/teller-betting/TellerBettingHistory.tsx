import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { TellerVoidBetDialog } from '@/components/teller-betting/TellerVoidBetDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BET_SIDE_LABEL, BET_STATUS_LABEL } from '@/constants'
import { useVoidBet } from '@/hooks/useVoidBet'
import { fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'
import { ApiError } from '@/lib/api'
import { getBetVoidEligibility } from '@/lib/bet-void-eligibility'
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

function statusClass(status: BetRow['status']): string {
  if (status === 'VOIDED') return 'text-muted-foreground line-through'
  if (status === 'PENDING') return 'text-foreground'
  return 'text-muted-foreground'
}

/**
 * Recent tickets for the signed-in teller (`GET /bets` is server-scoped).
 * Cancel is shown on the right when void is allowed (OPEN fight + PENDING bet).
 */
export function TellerBettingHistory({ fight, className }: TellerBettingHistoryProps) {
  const fightId = fight?.id ?? null
  const fightOpen = fight?.status === 'OPEN'
  const [voidTarget, setVoidTarget] = useState<BetRow | null>(null)
  const voidBet = useVoidBet()

  const q = useQuery({
    queryKey: tellerBetHistoryQueryKey(fightId),
    queryFn: () =>
      listBets(fightId != null ? { fightId, limit: 80 } : { limit: 30 }),
    staleTime: 4_000
  })

  const bets = q.data?.bets ?? []
  const showActionColumn =
    fightOpen && bets.some((b) => getBetVoidEligibility({ bet: b, fight }).canVoid)

  function requestVoid(bet: BetRow) {
    const eligibility = getBetVoidEligibility({ bet, fight })
    if (!eligibility.canVoid) {
      toast.error(eligibility.blockReason ?? 'This ticket cannot be cancelled.')
      return
    }
    setVoidTarget(bet)
  }

  function confirmVoid(reason: string | undefined) {
    if (!voidTarget) return
    voidBet.mutate(
      { betId: voidTarget.id, body: reason ? { reason } : {} },
      {
        onSuccess: (res) => {
          setVoidTarget(null)
          toast.success(
            res.replay
              ? `Ticket ${res.bet.code} was already voided.`
              : `Ticket ${res.bet.code} cancelled.`,
            { duration: 2200 }
          )
        },
        onError: (e) => {
          const msg = e instanceof ApiError ? e.message : e.message
          toast.error(msg)
        }
      }
    )
  }

  return (
    <>
      <Card className={cn('border-2 border-zinc-200 shadow-sm', className)}>
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-base font-bold tracking-tight">Betting history</CardTitle>
          <p className="text-xs text-muted-foreground">
            {fight == null
              ? 'Your most recent tickets (any fight).'
              : fightOpen
                ? `Fight #${fight.fightNumber} — pending tickets can be cancelled while betting is open.`
                : `Tickets on fight #${fight.fightNumber}.`}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">Loading…</p>
          ) : q.isError ? (
            <p className="px-4 py-8 text-center text-xs text-destructive">
              Could not load history.
            </p>
          ) : bets.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              No tickets yet{fightId ? ' for this fight.' : '.'}
            </p>
          ) : (
            <div className="max-h-[min(40dvh,22rem)] overflow-y-auto">
              {showActionColumn ? (
                <div
                  className="flex items-center justify-end border-b bg-muted/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  role="row"
                >
                  <span role="columnheader">Action</span>
                </div>
              ) : null}
              <ul className="divide-y divide-border/70">
                {bets.map((b) => {
                  const eligibility = getBetVoidEligibility({ bet: b, fight })
                  const voidPending =
                    voidBet.isPending && voidTarget?.id === b.id

                  return (
                    <li
                      key={b.id}
                      className="flex items-start gap-2 px-3 py-2.5 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span
                            className={cn(
                              'font-mono text-[11px] font-semibold',
                              statusClass(b.status)
                            )}
                          >
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
                          <span
                            className={cn(
                              'tabular-nums font-semibold',
                              statusClass(b.status)
                            )}
                          >
                            {formatMoney(b.amount)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'mt-0.5 text-[10px] text-muted-foreground',
                            statusClass(b.status)
                          )}
                        >
                          {BET_STATUS_LABEL[b.status] ?? b.status} ·{' '}
                          {fmtWhenShort(b.createdAt)}
                        </p>
                      </div>
                      <div className="flex w-[4.5rem] shrink-0 justify-end pt-0.5">
                        {eligibility.canVoid ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 w-full px-1 text-[10px] font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={voidPending}
                            onClick={() => requestVoid(b)}
                          >
                            {voidPending ? '...' : 'Cancel'}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <TellerVoidBetDialog
        bet={voidTarget}
        fightNumber={fight?.fightNumber ?? null}
        pending={voidBet.isPending}
        onClose={() => setVoidTarget(null)}
        onConfirm={confirmVoid}
      />
    </>
  )
}
