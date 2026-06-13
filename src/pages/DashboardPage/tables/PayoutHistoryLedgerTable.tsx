import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BET_SIDE_LABEL } from '@/constants'
import { dash, fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import {
  formatBoardOdds,
  settledOddsForSide
} from '@/lib/fight-board-derive'
import { formatMoney } from '@/lib/format-money'
import { listLedger } from '@/lib/api-cash'
import type { LedgerEntryRow, LedgerEntryTypeWire } from '@/types/api'

const COLUMN_COUNT = 7

function signedMoney(amount: string) {
  const n = Number(amount)
  if (Number.isNaN(n)) return amount
  const abs = formatMoney(String(Math.abs(n).toFixed(2)))
  return n < 0 ? `−${abs}` : abs
}

function ledgerBetOdds(entry: LedgerEntryRow): string {
  if (entry.betSide == null) return '—'

  const settled = settledOddsForSide(
    {
      payoutRatioMeron: entry.payoutRatioMeron ?? null,
      payoutRatioWala: entry.payoutRatioWala ?? null
    },
    entry.betSide
  )
  if (settled != null) return formatBoardOdds(settled)

  const stake = entry.betAmount != null ? Number(entry.betAmount) : NaN
  const payout = entry.betPayoutAmount != null ? Number(entry.betPayoutAmount) : NaN
  if (Number.isFinite(stake) && stake > 0 && Number.isFinite(payout) && payout > 0) {
    return formatBoardOdds(payout / stake)
  }

  return '—'
}

export interface PayoutHistoryLedgerTableProps {
  tellerId?: string
  resolveTellerName: (id: string) => string
  panelClassName?: string
}

export function PayoutHistoryLedgerTable({
  tellerId,
  resolveTellerName,
  panelClassName
}: PayoutHistoryLedgerTableProps) {
  const scopeKey = tellerId ?? 'ALL'
  const ledgerType: LedgerEntryTypeWire = 'PAYOUT'

  const q = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'ledger', ledgerType, scopeKey],
    queryFn: () =>
      listLedger({
        tellerId,
        type: ledgerType,
        limit: 80
      }),
    staleTime: 5_000
  })

  const entries = q.data?.entries ?? []

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className={dash.header}>
        <CardTitle className={dash.title}>Payout history</CardTitle>
        <span className={dash.liveBadge}>Live</span>
      </CardHeader>
      <CardContent className="flex flex-col p-0">
        <div className={dash.bodyScroll}>
          <table className={dash.table}>
            <thead className={dash.thead}>
              <tr className="border-b border-border/60">
                <th className={dash.th}>User</th>
                <th className={`${dash.th} text-right`}>Bet amount</th>
                <th className={`${dash.th} text-center`}>Odds</th>
                <th className={dash.th}>Side</th>
                <th className={`${dash.th} text-right`}>Payout</th>
                <th className={dash.th}>Remarks</th>
                <th className={dash.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className={dash.empty}>
                    Loading…
                  </td>
                </tr>
              ) : q.isError ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className={`${dash.empty} text-destructive`}>
                    Could not load payouts.
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className={dash.empty}>
                    No payout rows in view.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className={dash.row}>
                    <td className={`${dash.td} font-medium`}>{resolveTellerName(e.tellerId)}</td>
                    <td className={`${dash.tdNum} text-right`}>
                      {e.betAmount != null ? formatMoney(e.betAmount) : '—'}
                    </td>
                    <td className={`${dash.tdNum} text-center`}>{ledgerBetOdds(e)}</td>
                    <td className={dash.td}>
                      {e.betSide != null ? BET_SIDE_LABEL[e.betSide] : '—'}
                    </td>
                    <td className={`${dash.tdNum} text-destructive`}>{signedMoney(e.amount)}</td>
                    <td className={`${dash.td} text-muted-foreground`}>
                      {e.notes?.trim() || 'Payout'}
                    </td>
                    <td className={`${dash.td} text-muted-foreground`}>{fmtWhenShort(e.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
