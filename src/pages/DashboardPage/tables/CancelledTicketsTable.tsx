import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BET_SIDE_LABEL } from '@/constants'
import { dash, fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { formatMoney } from '@/lib/format-money'
import { listBets } from '@/lib/api-bets'
import type { BetListRow } from '@/types/api'
import { cn } from '@/lib/utils'

const CANCELLED_TICKET_LIMIT = 100

function cancelledAt(bet: BetListRow): string {
  return bet.voidedAt ?? bet.createdAt
}

export interface CancelledTicketsTableProps {
  tellerId?: string
  resolveTellerName: (id: string) => string
  panelClassName?: string
}

/** Voided (cancelled) tickets — latest {@link CANCELLED_TICKET_LIMIT} for the dashboard scope. */
export function CancelledTicketsTable({
  tellerId,
  resolveTellerName,
  panelClassName
}: CancelledTicketsTableProps) {
  const scopeKey = tellerId ?? 'ALL'

  const q = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'bets', 'cancelled', scopeKey],
    queryFn: () =>
      listBets({
        tellerId,
        status: 'VOIDED',
        limit: CANCELLED_TICKET_LIMIT
      }),
    staleTime: 5_000
  })

  const bets = q.data?.bets ?? []
  const columnCount = 5

  const totalVoided = useMemo(
    () => bets.reduce((sum, b) => sum + Number(b.amount), 0),
    [bets]
  )

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className={dash.header}>
        <div className="min-w-0 flex-1">
          <CardTitle className={dash.title}>Cancelled tickets</CardTitle>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Latest {CANCELLED_TICKET_LIMIT} voided tickets
          </p>
        </div>
        <span className={dash.liveBadge}>Live</span>
      </CardHeader>
      <CardContent className="flex flex-col p-0">
        <div className={dash.bodyScroll}>
          <table className={cn(dash.table, 'table-fixed')}>
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '26%' }} />
              <col style={{ width: '26%' }} />
            </colgroup>
            <thead className={dash.thead}>
              <tr className="border-b border-border/60">
                <th className={dash.th}>Code</th>
                <th className={dash.th}>Side</th>
                <th className={`${dash.th} text-center`}>Fight #</th>
                <th className={dash.th}>Teller</th>
                <th className={dash.th}>Date</th>
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
                    Could not load cancelled tickets.
                  </td>
                </tr>
              ) : bets.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className={dash.empty}>
                    No cancelled tickets in view.
                  </td>
                </tr>
              ) : (
                bets.map((b) => (
                  <tr key={b.id} className={dash.row}>
                    <td className={`${dash.td} font-mono text-[11px] font-semibold line-through`}>
                      {b.code}
                    </td>
                    <td className={dash.td}>{BET_SIDE_LABEL[b.side]}</td>
                    <td className={`${dash.tdNum} text-center font-semibold`}>{b.fightNumber}</td>
                    <td className={`${dash.td} font-medium`}>
                      {b.tellerNameSnapshot ?? resolveTellerName(b.tellerId)}
                    </td>
                    <td className={`${dash.td} text-muted-foreground`}>
                      <div>{fmtWhenShort(cancelledAt(b))}</div>
                      {b.voidReason?.trim() ? (
                        <div className="text-[10px] opacity-80">{b.voidReason.trim()}</div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {bets.length > 0 ? (
          <div className={cn(dash.summaryBar, 'flex items-center justify-between gap-2')}>
            <span className="text-muted-foreground">
              {bets.length} ticket{bets.length === 1 ? '' : 's'}
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-muted-foreground">Total voided</span>
              <span className="text-sm font-bold tabular-nums text-primary">
                {Number.isFinite(totalVoided)
                  ? formatMoney(String(totalVoided.toFixed(2)))
                  : '—'}
              </span>
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
