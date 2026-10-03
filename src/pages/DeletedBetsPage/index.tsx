import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BET_SIDE_LABEL } from '@/constants'
import { listFights } from '@/lib/api-fights'
import { pruneDeletedBetsToFights, readDeletedBets } from '@/lib/deleted-bets-storage'
import type { Fight } from '@/types/api'
import { formatMoney } from '@/lib/format-money'
import { fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'

/** API max page size for `GET /fights`. */
const FIGHTS_PAGE_SIZE = 200

/** Current-session records only: drops deletions whose fight was wiped by a session reset. */
async function loadCurrentSessionDeletedBets() {
  const fights: Fight[] = []
  let cursor: string | undefined
  do {
    const page = await listFights({ limit: FIGHTS_PAGE_SIZE, cursor })
    fights.push(...page.fights)
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  return pruneDeletedBetsToFights(fights)
}

function sumMoney(values: string[]): string {
  const cents = values.reduce((s, v) => s + Math.round(Number(v) * 100), 0)
  return (cents / 100).toFixed(2)
}

/**
 * Hidden super_admin page at `/bets1` (not in navbar).
 * Totals + list of bets purged on `/bets` from this browser (localStorage `deletedBets`).
 */
export function DeletedBetsPage() {
  const q = useQuery({
    queryKey: ['deleted-bets', 'current-session'],
    queryFn: loadCurrentSessionDeletedBets,
    staleTime: 0
  })
  const bets = useMemo(
    () => q.data ?? (q.isError ? readDeletedBets() : []),
    [q.data, q.isError]
  )

  const totals = useMemo(
    () => ({
      count: bets.length,
      stake: sumMoney(bets.map((b) => b.amount)),
      commission: sumMoney(bets.map((b) => b.commissionDrop))
    }),
    [bets]
  )

  return (
    <div className="space-y-4 p-4 pb-10">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Deleted bets</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{totals.count.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Total stake deleted</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatMoney(totals.stake)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Total commission removed (dashboard)</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatMoney(totals.commission)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <div>
            <CardTitle className="text-base">Deleted bets</CardTitle>
            <CardDescription>Recorded on this computer when a bet is deleted on /bets.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={q.isFetching}
            onClick={() => void q.refetch()}
          >
            Refresh
          </Button>
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
                  <th className="px-3 py-2 text-right">Stake</th>
                  <th className="px-3 py-2 text-right">Comm. removed</th>
                  <th className="px-3 py-2">Deleted</th>
                </tr>
              </thead>
              <tbody>
                {bets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      {q.isPending ? 'Loading…' : 'No deleted bets recorded on this computer.'}
                    </td>
                  </tr>
                ) : (
                  bets.map((b) => (
                    <tr key={b.betId} className="border-b border-border/60">
                      <td className="px-3 py-2 font-mono text-xs">{b.code}</td>
                      <td className="px-3 py-2 tabular-nums">#{b.fightNumber}</td>
                      <td className="px-3 py-2">{b.tellerName ?? b.tellerId.slice(0, 8)}</td>
                      <td className="px-3 py-2">{BET_SIDE_LABEL[b.side]}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMoney(b.amount)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {formatMoney(b.commissionDrop)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{fmtWhenShort(b.deletedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
