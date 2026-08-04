import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { aggregateSessionBets } from '@/lib/aggregate-session-bets'
import { getFightCommissions, getTellerCommissions } from '@/lib/api-reports'
import { listFights } from '@/lib/api-fights'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { formatMoney } from '@/lib/format-money'
import { sumLedgerEntries } from '@/lib/sum-ledger-entries'
import { dash } from '@/pages/DashboardPage/dashboard-dense'
import { cn } from '@/lib/utils'

/** House share is half of the gross commission pool (both sides). */
function formatHalvedCommission(commission: string): string {
  const halved = Number(commission) / 2
  return Number.isFinite(halved) ? formatMoney(String(halved.toFixed(2))) : '—'
}

function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toLocaleString()
}

function formatLedgerTotal(value: number | null | undefined, absolute = false): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const n = absolute ? Math.abs(value) : value
  return formatMoney(String(n.toFixed(2)))
}

interface SessionSummaryData {
  fightCount: number
  commission: string
  grossHandle: string
  betCount: number
  totalDeposits: number
  totalRemittances: number
}

async function fetchAdminSessionSummary(tellerId?: string): Promise<SessionSummaryData> {
  const scopeAll = tellerId == null

  const [fightComm, tellerComm, deposits, remittances, scopedBets] = await Promise.all([
    getFightCommissions(),
    getTellerCommissions(),
    sumLedgerEntries({ type: 'CASH_ADVANCE', tellerId }),
    sumLedgerEntries({ type: 'REMIT', tellerId }),
    scopeAll ? Promise.resolve(null) : aggregateSessionBets(tellerId)
  ])

  if (scopeAll) {
    return {
      fightCount: fightComm.totals.fightCount,
      // Bet-driven (same as Commissions by teller) — not fight pools, so bet purge lowers this.
      commission: tellerComm.totals.commissionGenerated,
      grossHandle: tellerComm.totals.grossHandle,
      betCount: tellerComm.totals.betCount,
      totalDeposits: deposits,
      totalRemittances: remittances
    }
  }

  const tellerRow = tellerComm.tellers.find((t) => t.tellerId === tellerId)
  return {
    fightCount: fightComm.totals.fightCount,
    commission: tellerRow?.commissionGenerated ?? '0.00',
    grossHandle: scopedBets?.grossHandle ?? '0.00',
    betCount: scopedBets?.betCount ?? 0,
    totalDeposits: deposits,
    totalRemittances: remittances
  }
}

async function fetchTellerSessionSummary(tellerId: string): Promise<SessionSummaryData> {
  const [bets, deposits, remittances] = await Promise.all([
    aggregateSessionBets(tellerId),
    sumLedgerEntries({ type: 'CASH_ADVANCE', tellerId }),
    sumLedgerEntries({ type: 'REMIT', tellerId })
  ])

  let cursor: string | undefined
  let fightCount = 0
  do {
    const page = await listFights({ limit: 200, cursor })
    fightCount += page.fights.length
    cursor = page.nextCursor ?? undefined
  } while (cursor)

  return {
    fightCount,
    commission: '0.00',
    grossHandle: bets.grossHandle,
    betCount: bets.betCount,
    totalDeposits: deposits,
    totalRemittances: remittances
  }
}

function SummaryMetric({
  label,
  value,
  loading
}: {
  label: string
  value: string
  loading?: boolean
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/25 px-4 py-3.5 sm:px-5 sm:py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums leading-tight sm:text-3xl',
          loading && 'text-muted-foreground'
        )}
      >
        {loading ? '…' : value}
      </p>
    </div>
  )
}

export interface SessionSummaryCardProps {
  tellerId?: string
  isAdmin: boolean
  panelClassName?: string
}

export function SessionSummaryCard({
  tellerId,
  isAdmin,
  panelClassName
}: SessionSummaryCardProps) {
  const scopeKey = tellerId ?? 'ALL'

  const q = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'session-summary', scopeKey],
    queryFn: () =>
      isAdmin
        ? fetchAdminSessionSummary(tellerId)
        : fetchTellerSessionSummary(tellerId!),
    enabled: isAdmin || tellerId != null,
    staleTime: 30_000
  })

  const data = q.data
  const loading = q.isLoading

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className="px-4 py-3 sm:px-5">
        <CardTitle className="text-base font-semibold sm:text-lg">Session summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-0 sm:space-y-4 sm:px-5 sm:pb-5">
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <SummaryMetric
            label="Total fights"
            loading={loading}
            value={formatCount(data?.fightCount)}
          />
          <SummaryMetric
            label="Total commission"
            loading={loading}
            value={
              isAdmin && data ? formatHalvedCommission(data.commission) : '—'
            }
          />
          <SummaryMetric
            label="Total bets amount"
            loading={loading}
            value={data ? formatMoney(data.grossHandle) : '—'}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <SummaryMetric
            label="Total # of bets"
            loading={loading}
            value={formatCount(data?.betCount)}
          />
          <SummaryMetric
            label="Total deposits"
            loading={loading}
            value={formatLedgerTotal(data?.totalDeposits)}
          />
          <SummaryMetric
            label="Total remittances"
            loading={loading}
            value={formatLedgerTotal(data?.totalRemittances, true)}
          />
        </div>
        {q.isError ? (
          <p className="text-[11px] text-destructive">Could not load session summary.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
