import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BET_SIDE_LABEL, BET_STATUS_LABEL } from '@/constants'
import { dash, fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'
import { DASHBOARD_LIVE_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { ApiError } from '@/lib/api'
import { getBetByCode, listBets } from '@/lib/api-bets'
import { betListRowFromLookup } from '@/lib/bet-list-row'
import { formatBetListOdds } from '@/lib/fight-board-derive'
import { formatMoney } from '@/lib/format-money'
import {
  isCompleteTicketCode,
  sanitizeTicketInput,
  TICKET_CODE_MAX
} from '@/pages/PayoutMachinePage/payout-scan'
import type { BetListRow } from '@/types/api'
import { cn } from '@/lib/utils'

const RECENT_BET_LIMIT = 100
const BET_CODE_NOT_FOUND = 'Cannot find betting code.'

function formatBetPayout(bet: BetListRow): string {
  if (bet.payoutAmount == null || bet.payoutAmount === '') return '—'
  if (
    bet.status === 'LOST' ||
    bet.status === 'VOIDED' ||
    bet.status === 'REFUNDED' ||
    bet.status === 'PAID'
  ) {
    return '—'
  }
  return formatMoney(bet.payoutAmount)
}

function betMatchesTellerScope(bet: BetListRow, tellerId?: string): boolean {
  if (tellerId == null) return true
  return bet.tellerId === tellerId
}

function BettingTransactionRows({
  bets,
  resolveTellerName
}: {
  bets: BetListRow[]
  resolveTellerName: (id: string) => string
}) {
  return (
    <>
      {bets.map((b) => (
        <tr key={b.id} className={dash.row}>
          <td className={`${dash.td} font-medium`}>
            {b.tellerNameSnapshot ?? resolveTellerName(b.tellerId)}
          </td>
          <td className={`${dash.td} font-mono text-[11px] font-semibold tracking-wide`}>{b.code}</td>
          <td className={`${dash.tdNum} text-right`}>{formatMoney(b.amount)}</td>
          <td className={`${dash.tdNum} text-center`}>{formatBetListOdds(b)}</td>
          <td className={`${dash.tdNum} text-right`}>{formatBetPayout(b)}</td>
          <td className={dash.td}>{BET_SIDE_LABEL[b.side]}</td>
          <td className={`${dash.tdNum} text-center font-semibold`}>{b.fightNumber}</td>
          <td className={`${dash.td} text-muted-foreground`}>
            {BET_STATUS_LABEL[b.status] ?? b.status}
            {b.voidReason?.trim() ? ` · ${b.voidReason.trim()}` : ''}
          </td>
          <td className={`${dash.td} text-muted-foreground`}>{fmtWhenShort(b.createdAt)}</td>
        </tr>
      ))}
    </>
  )
}

export interface BettingTransactionsTableProps {
  tellerId?: string
  resolveTellerName: (id: string) => string
  panelClassName?: string
  /** When false, hides ticket code search (dashboard admins only). */
  searchEnabled?: boolean
}

export function BettingTransactionsTable({
  tellerId,
  resolveTellerName,
  panelClassName,
  searchEnabled = true
}: BettingTransactionsTableProps) {
  const scopeKey = tellerId ?? 'ALL'
  const searchInputRef = useRef<HTMLInputElement>(null)
  const lookupInFlightRef = useRef<string | null>(null)

  const [searchValue, setSearchValue] = useState('')
  const [lookupPending, setLookupPending] = useState(false)
  const [lookupRow, setLookupRow] = useState<BetListRow | null>(null)
  const [lookupCode, setLookupCode] = useState<string | null>(null)

  const q = useQuery({
    queryKey: [...DASHBOARD_LIVE_QUERY_PREFIX, 'bets', 'transactions', scopeKey],
    queryFn: () =>
      listBets({
        tellerId,
        limit: RECENT_BET_LIMIT
      }),
    staleTime: 5_000,
    enabled: lookupRow == null
  })

  const recentBets = q.data?.bets ?? []
  const isLookupView = lookupRow != null
  const displayBets = isLookupView ? [lookupRow] : recentBets
  const total = displayBets.reduce((s, b) => s + Number(b.amount), 0)
  const columnCount = 9

  const clearLookup = useCallback(() => {
    setLookupRow(null)
    setLookupCode(null)
    setSearchValue('')
    lookupInFlightRef.current = null
  }, [])

  useEffect(() => {
    clearLookup()
  }, [scopeKey, clearLookup])

  const runLookup = useCallback(
    async (rawCode: string) => {
      const normalized = sanitizeTicketInput(rawCode)
      if (!isCompleteTicketCode(normalized)) return
      if (lookupPending || lookupInFlightRef.current === normalized) return

      lookupInFlightRef.current = normalized
      setLookupPending(true)

      try {
        const response = await getBetByCode(normalized)
        const row = betListRowFromLookup(response)

        if (!betMatchesTellerScope(row, tellerId)) {
          toast.error(BET_CODE_NOT_FOUND)
          setSearchValue('')
          return
        }

        setLookupRow(row)
        setLookupCode(normalized)
        setSearchValue(normalized)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          toast.error(BET_CODE_NOT_FOUND)
        } else {
          const msg =
            e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Lookup failed.'
          toast.error(msg)
        }
        setSearchValue('')
      } finally {
        lookupInFlightRef.current = null
        setLookupPending(false)
        requestAnimationFrame(() => searchInputRef.current?.focus())
      }
    },
    [lookupPending, tellerId]
  )

  const trySubmitSearch = useCallback(
    (rawCode: string) => {
      if (lookupPending) return
      const normalized = sanitizeTicketInput(rawCode)
      if (!isCompleteTicketCode(normalized)) return
      void runLookup(normalized)
    },
    [lookupPending, runLookup]
  )

  function handleSearchChange(raw: string) {
    const code = sanitizeTicketInput(raw)
    setSearchValue(code)
    trySubmitSearch(code)
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const code = sanitizeTicketInput(searchValue)
    if (code.length === 0) {
      if (isLookupView) clearLookup()
      return
    }
    if (!isCompleteTicketCode(code)) {
      toast.error(`Ticket code must be ${TICKET_CODE_MAX} characters.`)
      setSearchValue('')
      return
    }
    void runLookup(code)
  }

  return (
    <Card className={dash.card(panelClassName)}>
      <CardHeader className={dash.header}>
        <div className="min-w-0 flex-1">
          <CardTitle className={dash.title}>Betting transactions</CardTitle>
          {isLookupView ? (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Showing ticket <span className="font-mono font-semibold">{lookupCode}</span>
            </p>
          ) : (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Latest {RECENT_BET_LIMIT} bets
            </p>
          )}
        </div>
        <span className={dash.liveBadge}>Live</span>
      </CardHeader>
      <CardContent className="flex flex-col p-0">
        {searchEnabled ? (
          <div className="flex flex-col gap-2 border-b border-border/60 px-3 py-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Label htmlFor="dash-bet-code-search" className="text-[10px] uppercase tracking-wide">
                Search ticket code
              </Label>
              <Input
                ref={searchInputRef}
                id="dash-bet-code-search"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={TICKET_CODE_MAX}
                disabled={lookupPending}
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Type or scan 8-character code"
                className="mt-1 h-10 bg-white font-mono text-xs uppercase tracking-wide dark:bg-white"
              />
            </div>
            {isLookupView ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 text-xs"
                disabled={lookupPending}
                onClick={clearLookup}
              >
                Show latest {RECENT_BET_LIMIT}
              </Button>
            ) : null}
          </div>
        ) : null}
        <div className={dash.bodyScroll}>
          <table className={cn(dash.table, 'min-w-[52rem] table-fixed')}>
            <colgroup>
              <col style={{ width: '14%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead className={dash.thead}>
              <tr className="border-b border-border/60">
                <th className={dash.th}>Teller</th>
                <th className={dash.th}>Code</th>
                <th className={`${dash.th} text-right`}>Bet amount</th>
                <th className={`${dash.th} text-center`}>Odds</th>
                <th className={`${dash.th} text-right`}>Payout</th>
                <th className={dash.th}>Side</th>
                <th className={`${dash.th} text-center`}>Fight #</th>
                <th className={dash.th}>Remarks</th>
                <th className={dash.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {lookupPending ? (
                <tr>
                  <td colSpan={columnCount} className={dash.empty}>
                    Looking up ticket…
                  </td>
                </tr>
              ) : !isLookupView && q.isLoading ? (
                <tr>
                  <td colSpan={columnCount} className={dash.empty}>
                    Loading…
                  </td>
                </tr>
              ) : !isLookupView && q.isError ? (
                <tr>
                  <td colSpan={columnCount} className={`${dash.empty} text-destructive`}>
                    Could not load bets.
                  </td>
                </tr>
              ) : displayBets.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className={dash.empty}>
                    No bets in view.
                  </td>
                </tr>
              ) : (
                <BettingTransactionRows bets={displayBets} resolveTellerName={resolveTellerName} />
              )}
            </tbody>
          </table>
        </div>
        {displayBets.length > 0 ? (
          <div className={dash.summaryBar}>
            <span className="text-muted-foreground">
              {isLookupView ? 'Bet amount' : 'Total amount'}
            </span>
            <span className="tabular-nums text-primary">
              {Number.isFinite(total) ? formatMoney(String(total.toFixed(2))) : '—'}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
