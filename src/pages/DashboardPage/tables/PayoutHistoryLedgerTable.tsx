import { useState } from 'react'
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
import { listFights } from '@/lib/api-fights'
import type { Fight, LedgerEntryRow, LedgerEntryTypeWire, ListLedgerResponse } from '@/types/api'

const COLUMN_COUNT = 7
const DEFAULT_PAYOUT_LIMIT = 200
/** API max page size for `/cash/ledger` and `/fights`. */
const PAGE_SIZE = 200

async function listAllFights(): Promise<Fight[]> {
  const fights: Fight[] = []
  let cursor: string | undefined
  do {
    const page = await listFights({ limit: PAGE_SIZE, cursor })
    fights.push(...page.fights)
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  return fights.sort((a, b) => b.fightNumber - a.fightNumber)
}

async function listAllPayoutsForFight(
  fightId: string,
  tellerId?: string
): Promise<ListLedgerResponse> {
  const entries: LedgerEntryRow[] = []
  let cursor: string | undefined
  do {
    const page = await listLedger({ tellerId, type: 'PAYOUT', fightId, limit: PAGE_SIZE, cursor })
    entries.push(...page.entries)
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  return { entries, nextCursor: null }
}

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
  const [fightId, setFightId] = useState('')

  const fightsQuery = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'fights', 'payout-filter'],
    queryFn: listAllFights,
    staleTime: 30_000
  })

  const q = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'ledger', ledgerType, scopeKey, fightId || 'ALL'],
    queryFn: () =>
      fightId
        ? listAllPayoutsForFight(fightId, tellerId)
        : listLedger({ tellerId, type: ledgerType, limit: DEFAULT_PAYOUT_LIMIT }),
    staleTime: 5_000
  })

  const entries = q.data?.entries ?? []

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className={dash.header}>
        <CardTitle className={dash.title}>Payout history</CardTitle>
        <div className="flex items-center gap-2">
          <select
            aria-label="Filter payouts by fight"
            className="h-7 min-w-[8rem] rounded-md border border-input bg-background px-2 text-[11px] shadow-sm"
            value={fightId}
            onChange={(e) => setFightId(e.target.value)}
          >
            <option value="">All fights (latest {DEFAULT_PAYOUT_LIMIT})</option>
            {(fightsQuery.data ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                Fight #{f.fightNumber}
              </option>
            ))}
          </select>
          <span className={dash.liveBadge}>Live</span>
        </div>
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
