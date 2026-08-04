import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { BET_SIDE_LABEL } from '@/constants'
import { dash, fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'
import { reprintBetTicket } from '@/lib/print-bet-ticket'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { formatBetListOdds } from '@/lib/fight-board-derive'
import { formatMoney } from '@/lib/format-money'
import { listBets } from '@/lib/api-bets'
import { useAuthUser } from '@/store/auth'
import type { BetListRow } from '@/types/api'
import { cn } from '@/lib/utils'

function formatBetPayout(bet: BetListRow): string {
  if (bet.payoutAmount == null || bet.payoutAmount === '') return '—'
  return formatMoney(bet.payoutAmount)
}

export interface MyTellerTableProps {
  /** When set, scopes the list to that teller (admin). Tellers are server-scoped to self. */
  tellerId?: string
  resolveTellerName: (id: string) => string
  panelClassName?: string
  /** Show reprint actions (used on `/my-teller`). */
  showReprint?: boolean
}

export function MyTellerTable({
  tellerId,
  resolveTellerName,
  panelClassName,
  showReprint = false
}: MyTellerTableProps) {
  const actor = useAuthUser()
  const scopeKey = tellerId ?? (showReprint ? 'SELF' : 'ALL')
  const [reprintingBetId, setReprintingBetId] = useState<string | null>(null)

  const q = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'bets', 'unpaid-payouts', scopeKey],
    queryFn: async () => {
      const [won, pendingRefunds] = await Promise.all([
        listBets({ tellerId, status: 'WON', limit: 100 }),
        listBets({ tellerId, status: 'PENDING_REFUND', limit: 100 })
      ])
      const bets = [...won.bets, ...pendingRefunds.bets].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      return { bets, nextCursor: null }
    },
    staleTime: 5_000
  })

  const rows = q.data?.bets ?? []
  const totalPayout = rows.reduce((sum, b) => sum + Number(b.payoutAmount ?? 0), 0)

  const columnCount = showReprint ? 8 : 7

  async function handleReprint(bet: BetListRow) {
    if (reprintingBetId != null) return
    setReprintingBetId(bet.id)
    try {
      const ok = await reprintBetTicket({
        bet,
        fightNumber: bet.fightNumber,
        tellerName: actor?.fullName ?? bet.tellerNameSnapshot
      })
      if (ok) {
        toast.success(`Ticket ${bet.code} sent to printer.`, { duration: 1800 })
      } else {
        toast.error(
          window.electronAPI?.isElectron
            ? 'Reprint failed. Check the printer in desktop config.json.'
            : 'Reprint failed. Allow pop-ups or use the Electron kiosk app.'
        )
      }
    } finally {
      setReprintingBetId(null)
    }
  }

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className={dash.header}>
        <div className="min-w-0 flex-1" />
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
              {showReprint ? <col style={{ width: '12%' }} /> : null}
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
                {showReprint ? <th className={dash.th}>Action</th> : null}
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
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className={dash.empty}>
                    No unpaid winners or pending refunds.
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className={dash.row}>
                    <td className={`${dash.td} font-mono text-[11px] font-semibold`}>{b.code}</td>
                    <td className={`${dash.tdNum} text-right`}>{formatMoney(b.amount)}</td>
                    <td className={`${dash.tdNum} text-center`}>{formatBetListOdds(b)}</td>
                    <td className={`${dash.tdNum} text-right font-medium`}>{formatBetPayout(b)}</td>
                    <td className={`${dash.tdNum} text-center font-semibold`}>{b.fightNumber}</td>
                    <td className={dash.td}>{BET_SIDE_LABEL[b.side]}</td>
                    <td className={`${dash.td} text-muted-foreground`}>
                      <div>{fmtWhenShort(b.createdAt)}</div>
                      <div className="text-[10px] opacity-80">
                        {b.tellerNameSnapshot ?? resolveTellerName(b.tellerId)}
                      </div>
                    </td>
                    {showReprint ? (
                      <td className={`${dash.td} text-right`}>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 min-w-20 px-2 text-[10px] font-bold"
                          disabled={reprintingBetId != null}
                          onClick={() => void handleReprint(b)}
                        >
                          {reprintingBetId === b.id ? '…' : 'Reprint barcode'}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={cn(dash.summaryBar, 'flex items-center justify-between gap-2')}>
          <span className="text-muted-foreground">
            {rows.length} ticket{rows.length === 1 ? '' : 's'}
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

/** @deprecated Use `MyTellerTable`. */
export function WinningTicketsTable(props: MyTellerTableProps) {
  return <MyTellerTable {...props} />
}
