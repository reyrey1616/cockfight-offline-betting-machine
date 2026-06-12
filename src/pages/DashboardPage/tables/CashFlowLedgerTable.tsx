import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dash, fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'
import { DASHBOARD_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { formatMoney } from '@/lib/format-money'
import { listLedger } from '@/lib/api-cash'
import { cn } from '@/lib/utils'
import type { LedgerEntryTypeWire } from '@/types/api'

function signedMoney(amount: string) {
  const n = Number(amount)
  if (Number.isNaN(n)) return amount
  const abs = formatMoney(String(Math.abs(n).toFixed(2)))
  return n < 0 ? `−${abs}` : abs
}

export interface CashFlowLedgerTableProps {
  tellerId?: string
  resolveTellerName: (id: string) => string
  panelClassName?: string
}

export function CashFlowLedgerTable({
  tellerId,
  resolveTellerName,
  panelClassName
}: CashFlowLedgerTableProps) {
  const scopeKey = tellerId ?? 'ALL'
  const ledgerType: LedgerEntryTypeWire = 'CASH_ADVANCE'

  const q = useQuery({
    queryKey: [...DASHBOARD_QUERY_PREFIX, 'ledger', ledgerType, scopeKey],
    queryFn: () =>
      listLedger({
        tellerId,
        type: ledgerType,
        limit: 80
      }),
    staleTime: 60_000
  })

  const entries = q.data?.entries ?? []
  const total = entries.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className={dash.header}>
        <CardTitle className={dash.title}>Teller&apos;s deposits</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2 text-xs"
          disabled={q.isFetching}
          onClick={() => void q.refetch()}
        >
          <RefreshCw className={cn('size-3', q.isFetching && 'animate-spin')} />
          Refresh
        </Button>
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
                    Could not load ledger.
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className={dash.empty}>
                    No cash advances in view.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className={dash.row}>
                    <td className={`${dash.td} font-medium`}>{resolveTellerName(e.tellerId)}</td>
                    <td className={dash.tdNum}>{signedMoney(e.amount)}</td>
                    <td className={`${dash.td} text-muted-foreground`}>
                      {e.notes?.trim() || 'Cash advance'}
                      {e.code ? ` · ${e.code}` : ''}
                    </td>
                    <td className={`${dash.td} text-muted-foreground`}>{fmtWhenShort(e.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {entries.length > 0 ? (
          <div className={dash.summaryBar}>
            <span className="text-muted-foreground">Net (ledger)</span>
            <span className="tabular-nums text-primary">
              {Number.isFinite(total) ? signedMoney(String(total.toFixed(2))) : '—'}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
