import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BET_SIDE_LABEL } from '@/constants'
import { ApiError } from '@/lib/api'
import { getBetByCode } from '@/lib/api-bets'
import { formatBoardOdds, settledOddsForSide } from '@/lib/fight-board-derive'
import { formatMoney } from '@/lib/format-money'
import { disqualificationMessage, isPayableWin } from '@/lib/payout-eligibility'
import { checkPayoutCashOnHand } from '@/lib/payout-cash-eligibility'
import { usePayBet } from '@/hooks/usePayBet'
import { useCashBalance } from '@/hooks/useCash'
import { useAuthUser } from '@/store/auth'
import type { BetRow, PlaceBetFightSummary } from '@/types/api'
import { isCompleteTicketCode, sanitizeTicketInput, TICKET_CODE_MAX } from '@/pages/PayoutMachinePage/payout-scan'

function fightDetailsLine(fight: PlaceBetFightSummary, bet: BetRow): string {
  const side = BET_SIDE_LABEL[bet.side]
  return `Fight #${fight.fightNumber} · ${side}`
}

function DetailLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium text-foreground">{children}</span>
    </div>
  )
}

/**
 * Payout desk: scan ticket → confirm payout in a modal, or see errors.
 * `POST /bets/:id/pay` marks the bet `PAID` when the teller confirms.
 */
export function PayoutMachinePage() {
  const actor = useAuthUser()
  const cashBalanceQuery = useCashBalance()
  const payBetMutation = usePayBet()
  const inputRef = useRef<HTMLInputElement>(null)
  const errorDialogRef = useRef<HTMLDialogElement>(null)
  const successDialogRef = useRef<HTMLDialogElement>(null)
  const lookupInFlightRef = useRef<string | null>(null)

  const [scanValue, setScanValue] = useState('')
  const [lookupPending, setLookupPending] = useState(false)
  const payPending = payBetMutation.isPending
  const [dialogMessage, setDialogMessage] = useState<string | null>(null)
  const [payable, setPayable] = useState<{ bet: BetRow; fight: PlaceBetFightSummary } | null>(null)

  const focusScanner = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [])

  useEffect(() => {
    focusScanner()
  }, [focusScanner])

  useEffect(() => {
    if (dialogMessage && errorDialogRef.current && !errorDialogRef.current.open) {
      errorDialogRef.current.showModal()
    }
  }, [dialogMessage])

  useEffect(() => {
    if (payable && successDialogRef.current && !successDialogRef.current.open) {
      successDialogRef.current.showModal()
    }
  }, [payable])

  const scannerLocked = lookupPending || payPending || payable != null || dialogMessage != null

  function handleClear() {
    setScanValue('')
    focusScanner()
  }

  async function runLookup(code: string) {
    const normalized = sanitizeTicketInput(code)
    if (!isCompleteTicketCode(normalized)) return
    if (lookupPending || lookupInFlightRef.current === normalized) return
    lookupInFlightRef.current = normalized

    setLookupPending(true)
    try {
      const { bet, fight } = await getBetByCode(normalized)
      if (actor && bet.tellerId !== actor.id) {
        setDialogMessage('This ticket is not bet on this teller.')
        return
      }
      if (isPayableWin(bet, fight)) {
        const cashCheck = checkPayoutCashOnHand(cashBalanceQuery.data?.balance, bet.payoutAmount)
        if (!cashCheck.ok) {
          setDialogMessage(cashCheck.message ?? 'Payout cannot be done — cash on hand is short.')
          return
        }
        errorDialogRef.current?.close()
        setDialogMessage(null)
        setPayable({ bet, fight })
      } else {
        setDialogMessage(disqualificationMessage(bet, fight))
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setDialogMessage('No bet found for this code.')
      } else {
        const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Lookup failed.'
        setDialogMessage(msg)
      }
    } finally {
      lookupInFlightRef.current = null
      setLookupPending(false)
      setScanValue('')
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
    trySubmitScan(code)
  }

  function handleScanKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const code = sanitizeTicketInput(scanValue)
    if (code.length === 0) return
    if (code.length !== TICKET_CODE_MAX) {
      setDialogMessage('Ticket code must be 8 characters.')
      setScanValue('')
      return
    }
    trySubmitScan(code)
  }

  function handleConfirmPaid() {
    if (!payable) return
    const cashCheck = checkPayoutCashOnHand(
      cashBalanceQuery.data?.balance,
      payable.bet.payoutAmount
    )
    if (!cashCheck.ok) {
      successDialogRef.current?.close()
      setPayable(null)
      setDialogMessage(cashCheck.message ?? 'Payout cannot be done — cash on hand is short.')
      return
    }
    payBetMutation.mutate(payable.bet.id, {
      onSuccess: (res) => {
        toast.success(res.replay ? 'Already marked as paid.' : 'Payout recorded.', { duration: 2200 })
        successDialogRef.current?.close()
      },
      onError: (e) => {
        const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not record payout.'
        toast.error(msg)
      }
    })
  }

  const payoutOdds =
    payable != null ? settledOddsForSide(payable.fight, payable.bet.side) : null
  const payoutOddsDisplay = formatBoardOdds(payoutOdds)
  const payoutAmountDisplay =
    payable?.bet.payoutAmount != null ? formatMoney(payable.bet.payoutAmount) : '—'
  const payoutCashCheck =
    payable != null
      ? checkPayoutCashOnHand(cashBalanceQuery.data?.balance, payable.bet.payoutAmount)
      : null
  const canConfirmPayout = payoutCashCheck?.ok ?? false

  return (
    <div className="space-y-4 p-4 pb-10">
      <div className="border-b pb-4">
        <h1 className="text-xl font-semibold tracking-tight">Payout machine</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Scan a ticket (barcode wedge or type the code — lookup runs automatically at 8 characters). Confirm payout when the ticket
          is valid — focus always returns here for the next customer.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket scanner</CardTitle>
          <CardDescription>
            Field focuses on load and after each action. Lookup runs when the code is 8 characters; use Clear to wipe
            the field without submitting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="payout-scan-input">Reference code</Label>
          <div className="flex max-w-md flex-wrap items-stretch gap-2">
            <Input
              id="payout-scan-input"
              ref={inputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={TICKET_CODE_MAX}
              disabled={scannerLocked}
              placeholder="Scan ticket…"
              className="min-w-48 flex-1 font-mono text-lg tracking-widest"
              value={scanValue}
              onChange={(ev) => handleScanChange(ev.target.value)}
              onKeyDown={handleScanKeyDown}
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={scannerLocked}
              onClick={handleClear}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error / info modal */}
      <dialog
        ref={errorDialogRef}
        className="fixed left-1/2 top-1/2 z-50 w-[min(100%,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-4 text-sm shadow-lg backdrop:bg-black/50"
        onClose={() => {
          setDialogMessage(null)
          focusScanner()
        }}
      >
        {dialogMessage ? (
          <div className="space-y-4">
            <p className="leading-relaxed text-foreground">{dialogMessage}</p>
            <form method="dialog" className="flex justify-end">
              <Button type="submit">OK</Button>
            </form>
          </div>
        ) : null}
      </dialog>

      {/* Winning ticket — confirm payout */}
      <dialog
        ref={successDialogRef}
        className="fixed left-1/2 top-1/2 z-50 w-[min(100%,26rem)] max-h-[min(90dvh,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-background p-5 text-sm shadow-lg backdrop:bg-black/50"
        onClose={() => {
          setPayable(null)
          focusScanner()
        }}
      >
        {payable ? (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pay customer</p>
              <p
                className="mt-2 text-5xl font-black tabular-nums leading-none tracking-tight text-green-700 dark:text-green-400 sm:text-6xl"
                aria-live="polite"
              >
                {payoutAmountDisplay}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Total payout
              </p>
              <p className="mt-4 text-2xl font-bold tabular-nums tracking-tight text-foreground">
                {payoutOddsDisplay}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Payout odds
              </p>
            </div>

            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <DetailLine label="Teller">{payable.bet.tellerNameSnapshot ?? '—'}</DetailLine>
              <DetailLine label="Fight / event">{fightDetailsLine(payable.fight, payable.bet)}</DetailLine>
              <DetailLine label="Bet amount">{formatMoney(payable.bet.amount)}</DetailLine>
              <DetailLine label="Reference code">
                <span className="font-mono text-xs">{payable.bet.code}</span>
              </DetailLine>
            </div>

            <div className="flex justify-end border-t pt-4">
              {!canConfirmPayout && payoutCashCheck?.message ? (
                <p className="mr-auto max-w-[14rem] text-left text-xs text-destructive">
                  {payoutCashCheck.message}
                </p>
              ) : null}
              <Button
                type="button"
                className="min-w-[8rem]"
                disabled={payPending || !canConfirmPayout}
                onClick={() => void handleConfirmPaid()}
              >
                {payPending ? 'Recording…' : 'Paid'}
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  )
}
