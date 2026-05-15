import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BET_SIDE_LABEL } from '@/constants'
import { ApiError } from '@/lib/api'
import { getBetByCode, payBet } from '@/lib/api-bets'
import { formatMoney } from '@/lib/format-money'
import type { BetRow, PlaceBetFightSummary } from '@/types/api'

const TICKET_CODE_MAX = 8

function sanitizeTicketInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, TICKET_CODE_MAX)
}

function fightDetailsLine(fight: PlaceBetFightSummary, bet: BetRow): string {
  const side = BET_SIDE_LABEL[bet.side]
  return `Fight #${fight.fightNumber} · ${side}`
}

/** Winning ticket on a settled fight with a payout figure — ready to pay out. */
function isPayableWin(bet: BetRow, fight: PlaceBetFightSummary): boolean {
  return (
    bet.status === 'WON' &&
    fight.status === 'SETTLED' &&
    bet.payoutAmount != null &&
    bet.payoutAmount !== ''
  )
}

/**
 * When the API returned a bet but it must not be paid from this screen,
 * map to the cashier-facing modal copy.
 */
function disqualificationMessage(bet: BetRow, fight: PlaceBetFightSummary): string {
  if (fight.status === 'CANCELLED') {
    return 'This bet has been cancelled.'
  }
  if (fight.status !== 'SETTLED') {
    return 'This fight has not been settled yet.'
  }
  if (bet.status === 'VOIDED') {
    return 'This bet has been cancelled.'
  }
  if (bet.status === 'LOST') {
    return 'This bet did not win.'
  }
  if (
    bet.status === 'REFUNDED' &&
    (fight.outcome === 'DRAW' || fight.outcome === 'NO_CONTEST')
  ) {
    return 'This fight ended in a draw.'
  }
  if (bet.status === 'REFUNDED') {
    return 'This bet has been cancelled.'
  }
  if (bet.status === 'PAID') {
    return 'This winning ticket has already been paid out.'
  }
  if (bet.status === 'WON' && (bet.payoutAmount == null || bet.payoutAmount === '')) {
    return 'This winning ticket does not have a payout amount on record.'
  }
  if (bet.status === 'PENDING') {
    return 'This fight has not been settled yet.'
  }
  return 'This bet did not win.'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const errorDialogRef = useRef<HTMLDialogElement>(null)
  const successDialogRef = useRef<HTMLDialogElement>(null)

  const [scanValue, setScanValue] = useState('')
  const [lookupPending, setLookupPending] = useState(false)
  const [payPending, setPayPending] = useState(false)
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
    let refocusScanner = true
    setLookupPending(true)
    try {
      const { bet, fight } = await getBetByCode(code)
      if (isPayableWin(bet, fight)) {
        refocusScanner = false
        errorDialogRef.current?.close()
        setDialogMessage(null)
        setPayable({ bet, fight })
      } else {
        refocusScanner = false
        setDialogMessage(disqualificationMessage(bet, fight))
      }
    } catch (e) {
      refocusScanner = false
      if (e instanceof ApiError && e.status === 404) {
        setDialogMessage('No bet found for this code.')
      } else {
        const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Lookup failed.'
        setDialogMessage(msg)
      }
    } finally {
      setLookupPending(false)
      setScanValue('')
      if (refocusScanner) {
        focusScanner()
      }
    }
  }

  function handleScanKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (scannerLocked) return
    const code = sanitizeTicketInput(scanValue)
    if (code.length !== TICKET_CODE_MAX) {
      setDialogMessage('Ticket code must be 8 characters.')
      setScanValue('')
      return
    }
    void runLookup(code)
  }

  async function handleConfirmPaid() {
    if (!payable) return
    setPayPending(true)
    try {
      const res = await payBet(payable.bet.id)
      toast.success(res.replay ? 'Already marked as paid.' : 'Payout recorded.', { duration: 2200 })
      successDialogRef.current?.close()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not record payout.'
      toast.error(msg)
    } finally {
      setPayPending(false)
    }
  }

  const payoutAmountDisplay =
    payable?.bet.payoutAmount != null ? formatMoney(payable.bet.payoutAmount) : '—'

  return (
    <div className="space-y-4 p-4 pb-10">
      <div className="border-b pb-4">
        <h1 className="text-xl font-semibold tracking-tight">Payout machine</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Scan a ticket (barcode wedge or type the code and press Enter). Confirm payout when the ticket
          is valid — focus always returns here for the next customer.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket scanner</CardTitle>
          <CardDescription>
            Field focuses on load and after each action. Press Enter to look up a code; use Clear to wipe
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
              onChange={(ev) => setScanValue(sanitizeTicketInput(ev.target.value))}
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
                className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-green-700 dark:text-green-400"
                aria-live="polite"
              >
                {payoutAmountDisplay}
              </p>
            </div>

            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <DetailLine label="Bettor">{payable.bet.tellerNameSnapshot ?? '—'}</DetailLine>
              <DetailLine label="Fight / event">{fightDetailsLine(payable.fight, payable.bet)}</DetailLine>
              <DetailLine label="Bet amount">{formatMoney(payable.bet.amount)}</DetailLine>
              <DetailLine label="Reference code">
                <span className="font-mono text-xs">{payable.bet.code}</span>
              </DetailLine>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <form method="dialog">
                <Button type="submit" variant="outline" disabled={payPending}>
                  Cancel
                </Button>
              </form>
              <Button type="button" disabled={payPending} onClick={() => void handleConfirmPaid()}>
                {payPending ? 'Recording…' : 'Paid'}
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  )
}
