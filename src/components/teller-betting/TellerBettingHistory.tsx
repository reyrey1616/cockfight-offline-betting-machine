import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { TellerVoidBetDialog } from '@/components/teller-betting/TellerVoidBetDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BET_SIDE_LABEL, BET_STATUS_LABEL } from '@/constants'
import { useVoidBet } from '@/hooks/useVoidBet'
import { fmtWhenShort } from '@/pages/DashboardPage/dashboard-dense'
import { ApiError } from '@/lib/api'
import { getBetByCode, listBets } from '@/lib/api-bets'
import { getBetVoidEligibilityForTeller } from '@/lib/bet-void-eligibility'
import { formatMoney } from '@/lib/format-money'
import { reprintBetTicket } from '@/lib/print-bet-ticket'
import { tellerBetHistoryQueryKey } from '@/lib/teller-bets-query-keys'
import { cn } from '@/lib/utils'
import {
  isCompleteTicketCode,
  sanitizeTicketInput,
  TICKET_CODE_MAX
} from '@/pages/PayoutMachinePage/payout-scan'
import { useAuthUser } from '@/store/auth'
import type { BetRow, Fight, PlaceBetFightSummary } from '@/types/api'

export interface TellerBettingHistoryProps {
  fight: Fight | null
  className?: string
}

function sidePillClass(side: BetRow['side']): string {
  return side === 'MERON'
    ? 'bg-red-600/15 text-red-800 dark:text-red-200'
    : 'bg-blue-600/15 text-blue-800 dark:text-blue-200'
}

function statusClass(status: BetRow['status']): string {
  if (status === 'VOIDED') return 'text-muted-foreground line-through'
  if (status === 'PENDING') return 'text-foreground'
  return 'text-muted-foreground'
}

/**
 * Recent tickets for the signed-in teller (`GET /bets` is server-scoped).
 * Void via ticket scan + admin barcode authorization.
 */
export function TellerBettingHistory({ fight, className }: TellerBettingHistoryProps) {
  const actor = useAuthUser()
  const fightId = fight?.id ?? null
  const fightOpen = fight?.status === 'OPEN' || fight?.status === 'LAST_CALL'
  const scanInputRef = useRef<HTMLInputElement>(null)
  const lookupInFlightRef = useRef<string | null>(null)

  const [scanValue, setScanValue] = useState('')
  const [lookupPending, setLookupPending] = useState(false)
  const [voidTarget, setVoidTarget] = useState<{
    bet: BetRow
    fight: PlaceBetFightSummary
  } | null>(null)
  const [voidAuthError, setVoidAuthError] = useState<string | null>(null)
  const [reprintingBetId, setReprintingBetId] = useState<string | null>(null)
  const voidBet = useVoidBet()

  const q = useQuery({
    queryKey: tellerBetHistoryQueryKey(fightId),
    queryFn: () =>
      listBets(fightId != null ? { fightId, limit: 80 } : { limit: 30 }),
    staleTime: 4_000
  })

  const bets = q.data?.bets ?? []
  const scannerLocked = lookupPending || voidTarget != null || voidBet.isPending

  const focusScanner = useCallback(() => {
    if (scannerLocked) return
    requestAnimationFrame(() => {
      scanInputRef.current?.focus()
      scanInputRef.current?.select()
    })
  }, [scannerLocked])

  useEffect(() => {
    focusScanner()
  }, [focusScanner])

  async function runLookup(code: string) {
    const normalized = sanitizeTicketInput(code)
    if (!isCompleteTicketCode(normalized)) return
    if (lookupPending || lookupInFlightRef.current === normalized) return
    lookupInFlightRef.current = normalized

    setLookupPending(true)
    try {
      const { bet, fight: betFight } = await getBetByCode(normalized)
      const eligibility = getBetVoidEligibilityForTeller({
        bet,
        fight: betFight,
        tellerId: actor?.id ?? null,
        currentFight: fight
      })
      if (!eligibility.canVoid) {
        toast.error(eligibility.blockReason ?? 'This ticket cannot be cancelled.')
        return
      }
      setVoidAuthError(null)
      setVoidTarget({ bet, fight: betFight })
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        toast.error('No bet found for this ticket code.')
      } else {
        const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Lookup failed.'
        toast.error(msg)
      }
    } finally {
      lookupInFlightRef.current = null
      setLookupPending(false)
      setScanValue('')
      focusScanner()
    }
  }

  function trySubmitScan(code: string) {
    if (scannerLocked || lookupPending) return
    const normalized = sanitizeTicketInput(code)
    if (!isCompleteTicketCode(normalized)) return
    void runLookup(normalized)
  }

  function handleScanChange(raw: string) {
    const code = sanitizeTicketInput(raw)
    setScanValue(code)
    if (isCompleteTicketCode(code)) {
      trySubmitScan(code)
    }
  }

  function handleScanKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    trySubmitScan(scanValue)
  }

  function closeVoidDialog() {
    setVoidTarget(null)
    setVoidAuthError(null)
    focusScanner()
  }

  function confirmVoid(adminPassword: string) {
    if (!voidTarget) return
    setVoidAuthError(null)
    voidBet.mutate(
      {
        betId: voidTarget.bet.id,
        body: { adminPassword }
      },
      {
        onSuccess: (res) => {
          setVoidTarget(null)
          toast.success(
            res.replay
              ? `Ticket ${res.bet.code} was already voided.`
              : `Ticket ${res.bet.code} cancelled.`,
            { duration: 2200 }
          )
          focusScanner()
        },
        onError: (e) => {
          const msg = e instanceof ApiError ? e.message : e.message
          const isAdminAuthFailure =
            e instanceof ApiError && (e.status === 401 || e.status === 403)
          if (isAdminAuthFailure) {
            setVoidAuthError(msg)
            return
          }
          toast.error(msg)
          setVoidTarget(null)
          focusScanner()
        }
      }
    )
  }

  async function handleReprint(bet: BetRow) {
    if (fight?.fightNumber == null) {
      toast.error('Fight context is required to reprint this ticket.')
      return
    }
    if (reprintingBetId != null) return

    setReprintingBetId(bet.id)
    try {
      const ok = await reprintBetTicket({
        bet,
        fightNumber: fight.fightNumber,
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
      focusScanner()
    }
  }

  return (
    <>
      <Card className={cn('border-2 border-zinc-200 shadow-sm', className)}>
        <CardHeader className="border-b bg-muted/30 py-3">
          <CardTitle className="text-base font-bold tracking-tight">Betting history</CardTitle>
          <p className="text-xs text-muted-foreground">
            {fight == null
              ? 'Your most recent tickets (any fight). Scan a ticket above to cancel while its fight is open.'
              : fightOpen
                ? `Fight #${fight.fightNumber} — scan a ticket for this fight to cancel while betting is open or on last call.`
                : `Tickets on fight #${fight.fightNumber}. Scan a ticket for this fight to check whether it can still be cancelled.`}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Label htmlFor="void-ticket-scan" className="text-xs">
              Cancel ticket (scan slip)
            </Label>
            <Input
              ref={scanInputRef}
              id="void-ticket-scan"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={TICKET_CODE_MAX}
              disabled={scannerLocked}
              value={scanValue}
              onChange={(e) => handleScanChange(e.target.value)}
              onKeyDown={handleScanKeyDown}
              placeholder="Scan 8-character ticket code"
              className="font-mono uppercase tracking-wide"
            />
            {lookupPending ? (
              <p className="text-[10px] text-muted-foreground">Looking up ticket…</p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {q.isLoading ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">Loading…</p>
          ) : q.isError ? (
            <p className="px-4 py-8 text-center text-xs text-destructive">
              Could not load history.
            </p>
          ) : bets.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              No tickets yet{fightId ? ' for this fight.' : '.'}
            </p>
          ) : (
            <div className="max-h-[min(40dvh,22rem)] overflow-y-auto">
              <div
                className="flex items-center justify-end border-b bg-muted/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                role="row"
              >
                <span role="columnheader">Action</span>
              </div>
              <ul className="divide-y divide-border/70">
                {bets.map((b) => {
                  const reprintPending = reprintingBetId === b.id

                  return (
                  <li key={b.id} className="flex items-start gap-2 px-3 py-2.5 text-xs">
                    <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={cn(
                          'font-mono text-[11px] font-semibold',
                          statusClass(b.status)
                        )}
                      >
                        {b.code}
                      </span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                          sidePillClass(b.side)
                        )}
                      >
                        {BET_SIDE_LABEL[b.side]}
                      </span>
                      <span
                        className={cn('tabular-nums font-semibold', statusClass(b.status))}
                      >
                        {formatMoney(b.amount)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'mt-0.5 text-[10px] text-muted-foreground',
                        statusClass(b.status)
                      )}
                    >
                      {BET_STATUS_LABEL[b.status] ?? b.status} · {fmtWhenShort(b.createdAt)}
                    </p>
                    </div>
                    <div className="flex w-[4.5rem] shrink-0 justify-end pt-0.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 w-full px-1 text-[10px] font-bold"
                        disabled={reprintPending || reprintingBetId != null}
                        onClick={() => void handleReprint(b)}
                      >
                        {reprintPending ? '…' : 'Reprint'}
                      </Button>
                    </div>
                  </li>
                  )
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <TellerVoidBetDialog
        bet={voidTarget?.bet ?? null}
        fightNumber={voidTarget?.fight.fightNumber ?? fight?.fightNumber ?? null}
        pending={voidBet.isPending}
        authError={voidAuthError}
        onClose={closeVoidDialog}
        onConfirm={confirmVoid}
      />
    </>
  )
}
