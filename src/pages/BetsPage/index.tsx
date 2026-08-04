import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BET_SIDE_LABEL, BET_STATUS_LABEL } from '@/constants'
import { ApiError } from '@/lib/api'
import { listBets, purgeBet } from '@/lib/api-bets'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { formatMoney } from '@/lib/format-money'
import { useTellersList } from '@/hooks/useUsers'
import type { BetListRow, PurgeBetResponse } from '@/types/api'

const PAGE_LIMIT = 200

/** Exact dashboard commission drop: (stake × rate) / 2 — matches UI halved display. */
function previewDashboardCommissionDrop(stake: string, commissionRate?: string | null): string {
  const rate = commissionRate != null && commissionRate !== '' ? Number(commissionRate) : 0.1
  const drop = (Number(stake) * rate) / 2
  return Number.isFinite(drop) ? formatMoney(drop.toFixed(2)) : '—'
}

/**
 * Hidden admin tool at `/bets` (not in navbar).
 * Purges settled PAID bets to lower teller commission; cash drops by commission only.
 */
export function BetsPage() {
  const queryClient = useQueryClient()
  const tellersQuery = useTellersList()
  const [tellerId, setTellerId] = useState<string>('')
  const [pendingBet, setPendingBet] = useState<BetListRow | null>(null)
  const [lastResult, setLastResult] = useState<PurgeBetResponse | null>(null)

  const betsQuery = useQuery({
    queryKey: ['admin-bets-purge', tellerId || 'ALL'],
    queryFn: () =>
      listBets({
        tellerId: tellerId || undefined,
        status: 'PAID',
        limit: PAGE_LIMIT
      })
  })

  const settledPaidBets = useMemo(
    () => (betsQuery.data?.bets ?? []).filter((b) => b.fightStatus === 'SETTLED'),
    [betsQuery.data?.bets]
  )

  const purgeMutation = useMutation({
    mutationFn: (betId: string) => purgeBet(betId),
    onSuccess: (res) => {
      setLastResult(res)
      setPendingBet(null)
      toast.success(
        `Purged ${res.purged.code}: teller commission −${formatMoney(res.impact.dashboardCommissionDrop)} (dashboard)`
      )
      void queryClient.invalidateQueries({ queryKey: ['admin-bets-purge'] })
      void queryClient.invalidateQueries({ queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX] })
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Purge failed.'
      toast.error(msg)
    }
  })

  const tellerName = (id: string) => {
    const t = tellersQuery.data?.users?.find((u) => u.id === id)
    return t?.fullName ?? id
  }

  return (
    <div className="space-y-4 p-4 pb-10">

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Showing up to {PAGE_LIMIT} most recent PAID tickets on settled fights.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Teller</span>
            <select
              className="h-9 min-w-[14rem] rounded-md border bg-background px-2 text-sm"
              value={tellerId}
              onChange={(e) => setTellerId(e.target.value)}
            >
              <option value="">All tellers</option>
              {(tellersQuery.data?.users ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.username})
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={betsQuery.isFetching}
            onClick={() => void betsQuery.refetch()}
          >
            Refresh
          </Button>
        </CardContent>
      </Card>

      {lastResult ? (
        <Card className="border-emerald-700/40 bg-emerald-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Last purge result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Ticket <span className="font-mono">{lastResult.purged.code}</span> · Fight #
              {lastResult.purged.fightNumber} · Stake {formatMoney(lastResult.impact.stakeRemoved)}
            </p>
            <p>
              Teller commission drop (dashboard):{' '}
              <strong>{formatMoney(lastResult.impact.dashboardCommissionDrop)}</strong>
              {' '}(report raw {formatMoney(lastResult.impact.reportCommissionDrop)})
            </p>
            <p>
              Cash on hand drop (bet-taker):{' '}
              <strong>{formatMoney(lastResult.impact.dashboardCommissionDrop)}</strong>
              {' '}— stake is not deducted from cash
            </p>
            <p>Fight pools / fight commission: unchanged</p>
            <ul className="mt-2 list-inside list-disc text-muted-foreground">
              {lastResult.impact.balances.map((b) => (
                <li key={b.tellerId}>
                  {tellerName(b.tellerId)}: cash {formatMoney(b.balanceBefore)} →{' '}
                  {formatMoney(b.balanceAfter)} (Δ {formatMoney(b.cashOnHandDelta)})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Settled paid bets</CardTitle>
          <CardDescription>
            {betsQuery.isLoading
              ? 'Loading…'
              : betsQuery.isError
                ? 'Could not load bets.'
                : `${settledPaidBets.length} row(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[min(70dvh,40rem)] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-card text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr className="border-b">
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Fight</th>
                  <th className="px-3 py-2">Teller</th>
                  <th className="px-3 py-2">Side</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Stake</th>
                  <th className="px-3 py-2 text-right">Comm. (UI)</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {settledPaidBets.length === 0 && !betsQuery.isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                      No settled PAID bets in this scope.
                    </td>
                  </tr>
                ) : null}
                {settledPaidBets.map((bet) => (
                  <tr key={bet.id} className="border-b border-border/60">
                    <td className="px-3 py-2 font-mono text-xs">{bet.code}</td>
                    <td className="px-3 py-2 tabular-nums">#{bet.fightNumber}</td>
                    <td className="px-3 py-2">{bet.tellerNameSnapshot ?? tellerName(bet.tellerId)}</td>
                    <td className="px-3 py-2">{BET_SIDE_LABEL[bet.side]}</td>
                    <td className="px-3 py-2">{BET_STATUS_LABEL[bet.status] ?? bet.status}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatMoney(bet.amount)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {previewDashboardCommissionDrop(bet.amount, bet.commissionRate)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={purgeMutation.isPending}
                        onClick={() => setPendingBet(bet)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pendingBet ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="purge-confirm-title"
        >
          <div className="w-full max-w-md rounded-lg border bg-background p-4 shadow-lg">
            <h2 id="purge-confirm-title" className="text-lg font-semibold">
              Delete bet {pendingBet.code}?
            </h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                Fight #{pendingBet.fightNumber} · {BET_STATUS_LABEL[pendingBet.status]} · Stake{' '}
                {formatMoney(pendingBet.amount)}
              </p>
              <p>
                Teller commission for{' '}
                <span className="text-foreground">
                  {pendingBet.tellerNameSnapshot ?? tellerName(pendingBet.tellerId)}
                </span>{' '}
                will drop by{' '}
                <span className="font-medium text-foreground">
                  {previewDashboardCommissionDrop(pendingBet.amount, pendingBet.commissionRate)}
                </span>{' '}
                on the dashboard
                {pendingBet.commissionRate
                  ? ` (rate ${(Number(pendingBet.commissionRate) * 100).toFixed(2)}%).`
                  : '.'}
              </p>
              <p>
                Cash on hand for the bet-taker will drop by{' '}
                <span className="font-medium text-foreground">
                  {previewDashboardCommissionDrop(pendingBet.amount, pendingBet.commissionRate)}
                </span>{' '}
                (commission only — not the full stake).
              </p>
              <p>Fight pools and fight commission will not change. Ticket scan will 404 afterward.</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={purgeMutation.isPending}
                onClick={() => setPendingBet(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={purgeMutation.isPending}
                onClick={() => purgeMutation.mutate(pendingBet.id)}
              >
                {purgeMutation.isPending ? 'Deleting…' : 'Delete permanently'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
