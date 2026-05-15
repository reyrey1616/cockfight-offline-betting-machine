import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BET_SIDE_LABEL } from '@/constants'
import { dash, fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { formatMoney } from '@/lib/format-money'
import { listBets } from '@/lib/api-bets'

export interface BettingTransactionsTableProps {
  tellerId?: string
  resolveTellerName: (id: string) => string
  panelClassName?: string
}

export function BettingTransactionsTable({
  tellerId,
  resolveTellerName,
  panelClassName
}: BettingTransactionsTableProps) {
  const scopeKey = tellerId ?? 'ALL'

  const q = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'bets', 'transactions', scopeKey],
    queryFn: () =>
      listBets({
        tellerId,
        limit: 100
      }),
    staleTime: 5_000
  })

  const bets = q.data?.bets ?? []
  const total = bets.reduce((s, b) => s + Number(b.amount), 0)

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className={dash.header}>
        <CardTitle className={dash.title}>Betting transactions</CardTitle>
        <span className={dash.liveBadge}>Live</span>
      </CardHeader>
      <CardContent className="flex flex-col p-0">
        <div className={dash.bodyScroll}>
          <table className={dash.table}>
            <thead className={dash.thead}>
              <tr className="border-b border-border/60">
                <th className={dash.th}>User</th>
                <th className={dash.th}>Amount</th>
                <th className={dash.th}>Remarks</th>
                <th className={dash.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading ? (
                <tr>
                  <td colSpan={4} className={dash.empty}>
                    Loading…
                  </td>
                </tr>
              ) : q.isError ? (
                <tr>
                  <td colSpan={4} className={`${dash.empty} text-destructive`}>
                    Could not load bets.
                  </td>
                </tr>
              ) : bets.length === 0 ? (
                <tr>
                  <td colSpan={4} className={dash.empty}>
                    No bets in view.
                  </td>
                </tr>
              ) : (
                bets.map((b) => (
                  <tr key={b.id} className={dash.row}>
                    <td className={`${dash.td} font-medium`}>
                      {b.tellerNameSnapshot ?? resolveTellerName(b.tellerId)}
                    </td>
                    <td className={dash.tdNum}>{formatMoney(b.amount)}</td>
                    <td className={`${dash.td} text-muted-foreground`}>
                      {b.code} · {BET_SIDE_LABEL[b.side]} · {b.status}
                    </td>
                    <td className={`${dash.td} text-muted-foreground`}>{fmtWhenShort(b.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {bets.length > 0 ? (
          <div className={dash.summaryBar}>
            <span className="text-muted-foreground">Total amount</span>
            <span className="tabular-nums text-primary">
              {Number.isFinite(total) ? formatMoney(String(total.toFixed(2))) : '—'}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
