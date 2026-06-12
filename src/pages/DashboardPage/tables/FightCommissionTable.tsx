import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dash } from '@/pages/DashboardPage/dashboard-dense'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { formatMoney } from '@/lib/format-money'
import { getFightCommissions } from '@/lib/api-reports'
import type { FightCommissionsTotals } from '@/types/api'
import { cn } from '@/lib/utils'

const fightCommissionColgroup = (
  <colgroup>
    <col style={{ width: '8%' }} />
    <col style={{ width: '14%' }} />
    <col style={{ width: '27%' }} />
    <col style={{ width: '27%' }} />
    <col style={{ width: '24%' }} />
  </colgroup>
)

const compact = {
  scroll: 'max-h-[clamp(120px,22dvh,11rem)] overflow-y-auto overflow-x-auto',
  table: 'w-full table-fixed text-center text-[10px]',
  thead:
    'sticky top-0 z-[1] bg-card/95 text-[9px] uppercase tracking-wide text-muted-foreground backdrop-blur-sm',
  th: 'px-1.5 py-1 font-semibold leading-tight',
  td: 'px-1.5 py-0.5 align-middle tabular-nums',
  tdFight: 'px-1.5 py-0.5 align-middle tabular-nums font-semibold',
  row: 'border-b border-border/50 last:border-0',
  empty: 'px-2 py-6 text-[10px] text-muted-foreground'
} as const

function formatOutcome(status: string, outcome: string | null): string {
  if (status === 'SETTLED' && outcome) return outcome
  if (status === 'CANCELLED') return 'Cancelled'
  return status.replace(/_/g, ' ')
}

/** House share is half of the gross commission pool (both sides). */
function formatHalvedCommission(commission: string): string {
  const halved = Number(commission) / 2
  return Number.isFinite(halved) ? formatMoney(String(halved.toFixed(2))) : '—'
}

function FightCommissionTotalsBar({ totals }: { totals: FightCommissionsTotals }) {
  const totalCell = cn(compact.td, 'py-1.5 font-semibold')

  return (
    <table className={cn(compact.table, dash.summaryBar)}>
      {fightCommissionColgroup}
      <tbody>
        <tr>
          <td className={totalCell}>
            <span className="block text-[9px] font-normal text-muted-foreground">Total fights</span>
            {totals.fightCount}
          </td>
          <td className={totalCell} />
          <td className={totalCell}>
            <span className="block text-[9px] font-normal text-muted-foreground">Total bets</span>
            {formatMoney(totals.grossHandle)}
          </td>
          <td className={totalCell}>
            <span className="block text-[9px] font-normal text-muted-foreground">Total commission</span>
            {formatHalvedCommission(totals.commission)}
          </td>
          <td className={totalCell}>
            <span className="block text-[9px] font-normal text-muted-foreground">Bet count</span>
            {totals.betCount}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export interface FightCommissionTableProps {
  enabled?: boolean
  panelClassName?: string
}

/** Per-fight house commission (gross pool + commission earned). */
export function FightCommissionTable({
  enabled = true,
  panelClassName
}: FightCommissionTableProps) {
  const q = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'fight-commissions'],
    queryFn: () => getFightCommissions(),
    enabled,
    staleTime: 5_000
  })

  const fights = q.data?.fights ?? []
  const totals = q.data?.totals

  const table = (
    <table className={compact.table}>
      {fightCommissionColgroup}
      <thead className={compact.thead}>
        <tr className="border-b border-border/60">
          <th className={compact.th}>#</th>
          <th className={compact.th}>Side</th>
          <th className={compact.th} title="Total bets both side">
            <span className="block">Total bets</span>
            <span className="block font-normal normal-case tracking-normal">both side</span>
          </th>
          <th className={compact.th}>Commission</th>
          <th className={compact.th} title="Number of bets">
            Bets
          </th>
        </tr>
      </thead>
      <tbody>
        {q.isPending ? (
          <tr>
            <td colSpan={5} className={compact.empty}>
              Loading fight commission…
            </td>
          </tr>
        ) : q.isError ? (
          <tr>
            <td colSpan={5} className={cn(compact.empty, 'text-destructive')}>
              Could not load fight commission.
            </td>
          </tr>
        ) : fights.length === 0 ? (
          <tr>
            <td colSpan={5} className={compact.empty}>
              No fights yet.
            </td>
          </tr>
        ) : (
          fights.map((f) => (
            <tr key={f.fightId} className={compact.row}>
              <td className={compact.tdFight}>
                <span>{f.fightNumber}</span>
                {f.wasCorrected ? (
                  <span className="block text-[8px] font-normal uppercase text-amber-700 dark:text-amber-400">
                    corr.
                  </span>
                ) : null}
              </td>
              <td className={compact.td}>{formatOutcome(f.status, f.outcome)}</td>
              <td className={compact.td}>{formatMoney(f.grossHandle)}</td>
              <td className={compact.td}>{formatHalvedCommission(f.commission)}</td>
              <td className={compact.td}>
                <span className="block">{f.betCount}</span>
                {f.pendingBetCount > 0 ? (
                  <span className="block text-[9px] font-normal text-muted-foreground">
                    {f.pendingBetCount} pend.
                  </span>
                ) : null}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-2 py-1.5">
        <CardTitle className="text-xs font-semibold leading-tight tracking-tight">
          Commission per fight
        </CardTitle>
        <span className={cn(dash.liveBadge, 'px-1 py-0 text-[8px]')}>Live</span>
      </CardHeader>
      <CardContent className="flex flex-col p-0">
        <div className={compact.scroll}>{table}</div>
        {totals ? <FightCommissionTotalsBar totals={totals} /> : null}
      </CardContent>
    </Card>
  )
}
