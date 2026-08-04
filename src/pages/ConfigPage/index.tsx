import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FIGHT_OUTCOME_LABEL, type FightOutcomeValue } from '@/constants'
import { ApiError } from '@/lib/api'
import { listBets } from '@/lib/api-bets'
import { listFights, unsettleFight } from '@/lib/api-fights'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { invalidateAllFightQueries } from '@/lib/fight-query-keys'
import type { Fight, UnsettleFightResponse } from '@/types/api'

const PAGE_LIMIT = 200
const BET_STATUSES_FOR_COUNTS =
  'WON,LOST,PENDING_REFUND,PAID,REFUNDED' as const

function outcomeLabel(outcome: Fight['outcome']): string {
  if (!outcome) return '—'
  if (outcome in FIGHT_OUTCOME_LABEL) {
    return FIGHT_OUTCOME_LABEL[outcome as FightOutcomeValue]
  }
  return outcome
}

function formatSettledAt(iso: string | null): string {
  if (!iso) return 'unknown time'
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

/** Latest SETTLED fight (list is fightNumber desc). */
async function fetchLatestSettledFight(): Promise<Fight | null> {
  const page = await listFights({ status: 'SETTLED', limit: 1 })
  return page.fights[0] ?? null
}

/** Any OPEN/LAST_CALL fight that will be closed when reverting. */
async function fetchLiveFightToClose(): Promise<{
  fightNumber: number
  status: string
  betCount: number
} | null> {
  const [openPage, lastCallPage] = await Promise.all([
    listFights({ status: 'OPEN', limit: 1 }),
    listFights({ status: 'LAST_CALL', limit: 1 })
  ])
  const live = openPage.fights[0] ?? lastCallPage.fights[0]
  if (!live) return null

  let betCount = 0
  let cursor: string | undefined
  for (;;) {
    const page = await listBets({
      fightId: live.id,
      statuses: 'PENDING,WON,LOST,PAID,PENDING_REFUND,REFUNDED',
      limit: PAGE_LIMIT,
      cursor
    })
    betCount += page.bets.length
    if (!page.nextCursor) break
    cursor = page.nextCursor
  }
  return { fightNumber: live.fightNumber, status: live.status, betCount }
}

/**
 * Hidden admin tool at `/config` (not in navbar).
 * Reverts the latest wrongly declared fight: SETTLED → CLOSED (closes any live fight first).
 */
export function ConfigPage() {
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lastResult, setLastResult] = useState<UnsettleFightResponse | null>(null)

  const fightQuery = useQuery({
    queryKey: ['admin-config-latest-settled-fight'],
    queryFn: fetchLatestSettledFight
  })

  const selectedFight = fightQuery.data ?? null
  const fightId = selectedFight?.id ?? ''

  const liveFightQuery = useQuery({
    queryKey: ['admin-config-live-fight-to-close'],
    queryFn: fetchLiveFightToClose
  })

  const betCountsQuery = useQuery({
    queryKey: ['admin-config-fight-bets', fightId],
    enabled: Boolean(fightId),
    queryFn: async () => {
      const bets: Awaited<ReturnType<typeof listBets>>['bets'] = []
      let cursor: string | undefined
      for (;;) {
        const page = await listBets({
          fightId,
          statuses: BET_STATUSES_FOR_COUNTS,
          limit: PAGE_LIMIT,
          cursor
        })
        bets.push(...page.bets)
        if (!page.nextCursor) break
        cursor = page.nextCursor
      }
      const counts = {
        won: 0,
        lost: 0,
        pendingRefund: 0,
        paid: 0,
        refunded: 0
      }
      for (const b of bets) {
        if (b.status === 'WON') counts.won += 1
        else if (b.status === 'LOST') counts.lost += 1
        else if (b.status === 'PENDING_REFUND') counts.pendingRefund += 1
        else if (b.status === 'PAID') counts.paid += 1
        else if (b.status === 'REFUNDED') counts.refunded += 1
      }
      return counts
    }
  })

  const blockedByCash =
    (betCountsQuery.data?.paid ?? 0) > 0 || (betCountsQuery.data?.refunded ?? 0) > 0

  const unsettleMutation = useMutation({
    mutationFn: (id: string) => unsettleFight(id),
    onSuccess: (res) => {
      setLastResult(res)
      setConfirmOpen(false)
      const closed = res.summary.closedFights
      const closedNote =
        closed.length > 0
          ? ` · closed Fight #${closed.map((c) => c.fightNumber).join(', #')}`
          : ''
      toast.success(
        `Fight #${res.fight.fightNumber} reverted to CLOSED — ${res.summary.betsReset} bet(s) reset to PENDING${closedNote}`
      )
      void queryClient.invalidateQueries({ queryKey: ['admin-config-latest-settled-fight'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-config-fight-bets'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-config-live-fight-to-close'] })
      invalidateAllFightQueries(queryClient)
      void queryClient.invalidateQueries({ queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX] })
    },
    onError: (e) => {
      let msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Revert failed.'
      if (e instanceof ApiError && e.details && typeof e.details === 'object') {
        const d = e.details as { paidCount?: number; refundedCount?: number }
        if (d.paidCount != null || d.refundedCount != null) {
          msg = `${msg} (PAID: ${d.paidCount ?? 0}, REFUNDED: ${d.refundedCount ?? 0})`
        }
      }
      toast.error(msg)
    }
  })

  const refreshAll = () => {
    void fightQuery.refetch()
    void liveFightQuery.refetch()
    if (fightId) void betCountsQuery.refetch()
  }

  return (
    <div className="space-y-4 p-4 pb-10">
      <div className="border-b pb-4">
        <h1 className="text-xl font-semibold tracking-tight">Fight result revert</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Admin-only, hidden route. Reverts the <span className="font-medium">latest settled</span>{' '}
          fight from <span className="font-medium">SETTLED</span> back to{' '}
          <span className="font-medium">CLOSED</span> (no winner; betting stays locked). Any
          currently open fight is closed first. Unpaid tickets reset to{' '}
          <span className="font-medium">PENDING</span>. Blocked if any ticket was already{' '}
          <span className="font-medium">PAID</span> / <span className="font-medium">REFUNDED</span>.
          After revert, declare the correct winner from Operate fights.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Latest settled fight</CardTitle>
          <CardDescription>
            Wrong declaration — revert to CLOSED (betting disabled), then declare again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-64 gap-1 text-sm">
            <span className="text-muted-foreground">Target</span>
            <p className="rounded-md border bg-muted/30 px-3 py-2 font-medium">
              {fightQuery.isLoading
                ? 'Loading…'
                : fightQuery.isError
                  ? 'Could not load fight'
                  : selectedFight
                    ? `Fight #${selectedFight.fightNumber} — ${outcomeLabel(selectedFight.outcome)} — ${formatSettledAt(selectedFight.settledAt)}`
                    : 'No settled fight'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={fightQuery.isFetching || liveFightQuery.isFetching}
            onClick={refreshAll}
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!selectedFight || unsettleMutation.isPending || blockedByCash}
            onClick={() => setConfirmOpen(true)}
          >
            Revert result
          </Button>
        </CardContent>
      </Card>

      {liveFightQuery.data ? (
        <Card className="border-sky-700/40">
          <CardContent className="pt-4 text-sm text-sky-900 dark:text-sky-200">
            Fight #{liveFightQuery.data.fightNumber} is {liveFightQuery.data.status}
            {liveFightQuery.data.betCount > 0
              ? ` with ${liveFightQuery.data.betCount} bet(s)`
              : ''}
            . Revert will close it, then return Fight #{selectedFight?.fightNumber ?? '—'} to
            CLOSED (betting disabled).
          </CardContent>
        </Card>
      ) : null}

      {selectedFight ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Fight #{selectedFight.fightNumber} preview
            </CardTitle>
            <CardDescription>
              Declared {outcomeLabel(selectedFight.outcome)} · settled{' '}
              {formatSettledAt(selectedFight.settledAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {betCountsQuery.isLoading ? (
              <p className="text-muted-foreground">Loading ticket counts…</p>
            ) : betCountsQuery.isError ? (
              <p className="text-destructive">Could not load ticket counts.</p>
            ) : (
              <>
                <ul className="grid gap-1 sm:grid-cols-2">
                  <li>
                    WON (will reset):{' '}
                    <span className="font-medium tabular-nums">
                      {betCountsQuery.data?.won ?? 0}
                    </span>
                  </li>
                  <li>
                    LOST (will reset):{' '}
                    <span className="font-medium tabular-nums">
                      {betCountsQuery.data?.lost ?? 0}
                    </span>
                  </li>
                  <li>
                    PENDING_REFUND (will reset):{' '}
                    <span className="font-medium tabular-nums">
                      {betCountsQuery.data?.pendingRefund ?? 0}
                    </span>
                  </li>
                  <li>
                    PAID (blocks revert):{' '}
                    <span className="font-medium tabular-nums">
                      {betCountsQuery.data?.paid ?? 0}
                    </span>
                  </li>
                  <li>
                    REFUNDED (blocks revert):{' '}
                    <span className="font-medium tabular-nums">
                      {betCountsQuery.data?.refunded ?? 0}
                    </span>
                  </li>
                </ul>
                {blockedByCash ? (
                  <p className="text-amber-700 dark:text-amber-400">
                    Revert is blocked because cash already left the drawer for this fight.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Safe to revert: no PAID or REFUNDED tickets on this fight.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {lastResult ? (
        <Card className="border-emerald-700/40 bg-emerald-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Last revert result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Fight #{lastResult.fight.fightNumber} is now{' '}
              <span className="font-medium">{lastResult.fight.status}</span>
            </p>
            <p>
              Bets reset to PENDING:{' '}
              <strong>{lastResult.summary.betsReset}</strong>
              {lastResult.summary.voidedSkipped > 0
                ? ` · VOIDED skipped: ${lastResult.summary.voidedSkipped}`
                : null}
            </p>
            {lastResult.summary.closedFights.length > 0 ? (
              <p>
                Closed live fight(s):{' '}
                {lastResult.summary.closedFights
                  .map((c) => `#${c.fightNumber} (${c.betCount} bet(s))`)
                  .join(', ')}
              </p>
            ) : null}
            <p className="text-muted-foreground">
              Declare the correct winner again from Operate fights. Betting stays locked until you
              reopen.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {confirmOpen && selectedFight ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsettle-confirm-title"
        >
          <div className="w-full max-w-md rounded-lg border bg-background p-4 shadow-lg">
            <h2 id="unsettle-confirm-title" className="text-lg font-semibold">
              Revert Fight #{selectedFight.fightNumber}?
            </h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                Current result:{' '}
                <span className="text-foreground">{outcomeLabel(selectedFight.outcome)}</span>
              </p>
              {liveFightQuery.data ? (
                <p>
                  Fight #{liveFightQuery.data.fightNumber} ({liveFightQuery.data.status}) will be{' '}
                  <span className="font-medium text-foreground">CLOSED</span>
                  {liveFightQuery.data.betCount > 0
                    ? ` — it still has ${liveFightQuery.data.betCount} bet(s)`
                    : ''}
                  .
                </p>
              ) : null}
              <p>
                Fight #{selectedFight.fightNumber} becomes{' '}
                <span className="font-medium text-foreground">CLOSED</span> (betting disabled).
                Unpaid WON / LOST / PENDING_REFUND tickets return to{' '}
                <span className="font-medium text-foreground">PENDING</span>. Pools stay unchanged.
              </p>
              <p>Declare the winner again from Operate fights when ready.</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={unsettleMutation.isPending}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={unsettleMutation.isPending || blockedByCash}
                onClick={() => unsettleMutation.mutate(selectedFight.id)}
              >
                {unsettleMutation.isPending ? 'Reverting…' : 'Confirm revert'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
