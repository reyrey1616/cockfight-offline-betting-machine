import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dash } from '@/pages/DashboardPage/dashboard-dense'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { formatMoney } from '@/lib/format-money'
import { getCashBalance } from '@/lib/api-cash'
import { cn } from '@/lib/utils'

export interface CashOnHandTableProps {
  tellerIds: string[]
  panelClassName?: string
}

export function CashOnHandTable({ tellerIds, panelClassName }: CashOnHandTableProps) {
  const key = [...tellerIds].sort().join(',')

  const q = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'balances', key],
    queryFn: () => Promise.all(tellerIds.map((id) => getCashBalance(id))),
    enabled: tellerIds.length > 0,
    staleTime: 5_000
  })

  const rows = q.data ?? []
  const total = rows.reduce((s, r) => s + Number(r.balance), 0)

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className={dash.header}>
        <CardTitle className={dash.title}>Cash on hand</CardTitle>
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
              {tellerIds.length === 0 ? (
                <tr>
                  <td colSpan={4} className={dash.empty}>
                    No tellers to show.
                  </td>
                </tr>
              ) : q.isLoading ? (
                <tr>
                  <td colSpan={4} className={dash.empty}>
                    Loading…
                  </td>
                </tr>
              ) : q.isError ? (
                <tr>
                  <td colSpan={4} className={`${dash.empty} text-destructive`}>
                    Could not load balances.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.tellerId} className={dash.row}>
                    <td className={`${dash.td} font-medium`}>{r.fullName}</td>
                    <td className={dash.tdNum}>{formatMoney(r.balance)}</td>
                    <td className={`${dash.td} text-muted-foreground`}>Cash on hand</td>
                    <td className={`${dash.td} text-muted-foreground`}>—</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {rows.length > 0 ? (
          <div className={cn(dash.summaryBar, 'flex items-center justify-between gap-2')}>
            <span className="text-muted-foreground">Total cash</span>
            <span className="text-sm font-bold tabular-nums text-primary">
              {Number.isFinite(total) ? formatMoney(String(total.toFixed(2))) : '—'}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
