import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dash } from '@/pages/DashboardPage/dashboard-dense'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { formatMoney } from '@/lib/format-money'
import { getTellerCommissions } from '@/lib/api-reports'
import { cn } from '@/lib/utils'

function sumMoneyStrings(values: string[]): string {
  const cents = values.reduce((s, v) => s + Math.round(Number(v) * 100), 0)
  return (cents / 100).toFixed(2)
}

/** House share is half of the gross commission pool (both sides). */
function formatHalvedCommission(commission: string): string {
  const halved = Number(commission) / 2
  return Number.isFinite(halved) ? formatMoney(String(halved.toFixed(2))) : '—'
}

/** Compact table chrome — commission card only. */
const compact = {
  scroll: 'h-[clamp(100px,18dvh,9.5rem)] overflow-y-auto overflow-x-auto',
  table: 'w-full text-left text-[10px]',
  thead: 'sticky top-0 z-[1] bg-card/95 text-[9px] uppercase tracking-wide text-muted-foreground backdrop-blur-sm',
  th: 'px-1.5 py-1 font-semibold',
  td: 'px-1.5 py-0.5 align-top',
  tdNum: 'px-1.5 py-0.5 tabular-nums align-top',
  row: 'border-b border-border/50 last:border-0',
  empty: 'px-1.5 py-6 text-center text-[10px] text-muted-foreground',
  summary:
    'flex flex-row items-center justify-between gap-2 border-t border-border/80 bg-muted/30 px-2 py-1.5 text-[10px] font-semibold'
} as const

export interface TellerCommissionsTableProps {
  /** When set, only that teller's row is shown; total matches the filter. */
  filterTellerId?: string
  enabled?: boolean
  panelClassName?: string
}

export function TellerCommissionsTable({
  filterTellerId,
  enabled = true,
  panelClassName
}: TellerCommissionsTableProps) {
  const q = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'teller-commissions'],
    queryFn: () => getTellerCommissions(),
    enabled,
    staleTime: 5_000
  })

  const { rows, totalCommission } = useMemo(() => {
    const all = q.data?.tellers ?? []
    if (!filterTellerId) {
      return {
        rows: all,
        totalCommission: q.data?.totals.commissionGenerated ?? '0.00'
      }
    }
    const rows = all.filter((t) => t.tellerId === filterTellerId)
    return {
      rows,
      totalCommission:
        rows.length > 0 ? sumMoneyStrings(rows.map((r) => r.commissionGenerated)) : '0.00'
    }
  }, [q.data, filterTellerId])

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-2 py-1.5">
        <CardTitle className="text-xs font-semibold leading-tight tracking-tight">
          Commissions by teller
        </CardTitle>
        <span className={cn(dash.liveBadge, 'px-1 py-0 text-[8px]')}>Live</span>
      </CardHeader>
      <CardContent className="flex flex-col p-0">
        <div className={compact.scroll}>
          <table className={compact.table}>
            <thead className={compact.thead}>
              <tr className="border-b border-border/60">
                <th className={compact.th}>Teller</th>
                <th className={compact.th}>Bets</th>
                <th className={compact.th}>Gross</th>
                <th className={compact.th}>Comm.</th>
              </tr>
            </thead>
            <tbody>
              {!enabled ? (
                <tr>
                  <td colSpan={4} className={compact.empty}>
                    Admin only.
                  </td>
                </tr>
              ) : q.isLoading ? (
                <tr>
                  <td colSpan={4} className={compact.empty}>
                    Loading…
                  </td>
                </tr>
              ) : q.isError ? (
                <tr>
                  <td colSpan={4} className={`${compact.empty} text-destructive`}>
                    Could not load.
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className={compact.empty}>
                    {filterTellerId ? 'No data for teller.' : 'No rows yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((t) => (
                  <tr key={t.tellerId} className={compact.row}>
                    <td className={`${compact.td} font-medium`}>
                      <span className="line-clamp-2 leading-snug">{t.fullName}</span>
                      {!t.isActive ? (
                        <span className="block text-[9px] font-normal text-muted-foreground">Off</span>
                      ) : null}
                    </td>
                    <td className={compact.tdNum}>{t.betCount}</td>
                    <td className={compact.tdNum}>{formatMoney(t.grossHandle)}</td>
                    <td className={`${compact.tdNum} text-primary`}>
                      {formatHalvedCommission(t.commissionGenerated)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {enabled ? (
          <div className={compact.summary}>
            <span className="text-muted-foreground">Total</span>
            <span className="tabular-nums text-primary">
              {q.isLoading || q.isError ? '—' : formatHalvedCommission(totalCommission)}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
