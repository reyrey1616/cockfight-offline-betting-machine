import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BET_SIDE_LABEL } from '@/constants'
import { dash, fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { boardOddsForSide, formatBoardOdds } from '@/lib/fight-board-derive'
import { formatMoney } from '@/lib/format-money'
import { listBets } from '@/lib/api-bets'
import type { BetListRow } from '@/types/api'
import { cn } from '@/lib/utils'

function formatBetOdds(bet: BetListRow): string {
  const odds = boardOddsForSide(
    {
      status: bet.fightStatus,
      meronOdds: bet.meronOdds,
      walaOdds: bet.walaOdds,
      payoutRatioMeron: bet.payoutRatioMeron,
      payoutRatioWala: bet.payoutRatioWala
    },
    bet.side
  )
  return formatBoardOdds(odds)
}

function formatBetPayout(bet: BetListRow): string {
  if (bet.payoutAmount == null || bet.payoutAmount === '') return '—'
  return formatMoney(bet.payoutAmount)
}

export interface WinningTicketsTableProps {
  tellerId?: string
  resolveTellerName: (id: string) => string
  panelClassName?: string
}

export function WinningTicketsTable({
  tellerId,
  resolveTellerName,
  panelClassName
}: WinningTicketsTableProps) {
  const scopeKey = tellerId ?? 'ALL'

  const q = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'bets', 'winning', scopeKey],
    queryFn: () =>
      listBets({
        tellerId,
        status: 'WON',
        limit: 100
      }),
    staleTime: 5_000
  })

  const bets = q.data?.bets ?? []

  const totalPayout = useMemo(
    () => bets.reduce((sum, b) => sum + Number(b.payoutAmount ?? 0), 0),
    [bets]
  )

  const columnCount = 7

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className={dash.header}>
        <CardTitle className={dash.title}>Winning tickets (unpaid)</CardTitle>
        <span className={dash.liveBadge}>Live</span>
      </CardHeader>
      <CardContent className="flex flex-col p-0">
        <div className={dash.bodyScroll}>
          <table className={cn(dash.table, 'table-fixed')}>
            <colgroup>
              <col style={{ width: '16%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '30%' }} />
            </colgroup>
            <thead className={dash.thead}>
              <tr className="border-b border-border/60">
                <th className={dash.th}>Code</th>
                <th className={`${dash.th} text-right`}>Amount</th>
                <th className={`${dash.th} text-center`}>Odds</th>
                <th className={`${dash.th} text-right`}>Payout</th>
                <th className={`${dash.th} text-center`}>Fight #</th>
                <th className={dash.th}>Side</th>
                <th className={dash.th}>When / teller</th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading ? (
                <tr>
                  <td colSpan={columnCount} className={dash.empty}>
                    Loading…
                  </td>
                </tr>
              ) : q.isError ? (
                <tr>
                  <td colSpan={columnCount} className={`${dash.empty} text-destructive`}>
                    Could not load winning tickets.
                  </td>
                </tr>
              ) : bets.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className={dash.empty}>
                    No unpaid winners.
                  </td>
                </tr>
              ) : (
                bets.map((b) => (
                  <tr key={b.id} className={dash.row}>
                    <td className={`${dash.td} font-mono text-[11px] font-semibold`}>{b.code}</td>
                    <td className={`${dash.tdNum} text-right`}>{formatMoney(b.amount)}</td>
                    <td className={`${dash.tdNum} text-center`}>{formatBetOdds(b)}</td>
                    <td className={`${dash.tdNum} text-right font-medium`}>{formatBetPayout(b)}</td>
                    <td className={`${dash.tdNum} text-center font-semibold`}>{b.fightNumber}</td>
                    <td className={dash.td}>{BET_SIDE_LABEL[b.side]}</td>
                    <td className={`${dash.td} text-muted-foreground`}>
                      <div>{fmtWhenShort(b.createdAt)}</div>
                      <div className="text-[10px] opacity-80">
                        {b.tellerNameSnapshot ?? resolveTellerName(b.tellerId)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={cn(dash.summaryBar, 'flex items-center justify-between gap-2')}>
          <span className="text-muted-foreground">
            {bets.length} ticket{bets.length === 1 ? '' : 's'}
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-muted-foreground">Total payout</span>
            <span className="text-sm font-bold tabular-nums text-primary">
              {Number.isFinite(totalPayout) ? formatMoney(String(totalPayout.toFixed(2))) : '—'}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
