import { useEffect, useRef, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import {
  isCompleteCollectorCode,
  sanitizeCollectorCodeInput
} from '@/lib/collector-scan'
import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'
import { parseStakeInput, sanitizeStakeInput } from '@/lib/teller-stake'
import { cn } from '@/lib/utils'
import { useCashAdvance, useCashRemit } from '@/hooks/useCash'
import { useCollectorByCode } from '@/hooks/useCollectors'

export type CashTransactionKind = 'deposit' | 'remit'

export interface TellerCashTransactionDialogProps {
  kind: CashTransactionKind | null
  onClose: () => void
  onSuccess?: (args: {
    kind: CashTransactionKind
    code: string | null
    balance: string
    collectorName: string
    amount: string
    recordedAt: string
    notes?: string
  }) => void
}

export function TellerCashTransactionDialog({
  kind,
  onClose,
  onSuccess
}: TellerCashTransactionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)
  const [collectorScan, setCollectorScan] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const collectorCode = sanitizeCollectorCodeInput(collectorScan)
  const collectorLookup = useCollectorByCode(collectorScan)
  const advance = useCashAdvance()
  const remit = useCashRemit()
  const pending = advance.isPending || remit.isPending

  const open = kind != null
  const title = kind === 'deposit' ? 'Record deposit' : kind === 'remit' ? 'Record remittance' : ''
  const resolvedCollector = collectorLookup.data?.collector
  const scanComplete = isCompleteCollectorCode(collectorCode)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [open])

  useEffect(() => {
    if (!open || pending) return
    const t = window.setTimeout(() => {
      scanInputRef.current?.focus()
      scanInputRef.current?.select()
    }, 0)
    return () => window.clearTimeout(t)
  }, [open, pending, kind])

  function resetForm() {
    setCollectorScan('')
    setAmount('')
    setNotes('')
    setFormError(null)
  }

  function handleClose() {
    if (pending) return
    resetForm()
    onClose()
  }

  function handleSubmit() {
    if (!kind) return
    const parsed = parseStakeInput(amount)
    if (!scanComplete) {
      setFormError('Scan the collector badge barcode.')
      return
    }
    if (collectorLookup.isFetching) {
      setFormError('Looking up collector — wait a moment.')
      return
    }
    if (collectorLookup.isError) {
      setFormError(
        collectorLookup.error instanceof ApiError
          ? collectorLookup.error.message
          : 'No collector matches that barcode.'
      )
      return
    }
    if (!resolvedCollector?.isActive) {
      setFormError('That collector is not active.')
      return
    }
    if (parsed == null) {
      setFormError('Enter a valid amount greater than zero (max 2 decimal places).')
      return
    }

    setFormError(null)
    const notesTrimmed = notes.trim() || undefined
    const collectorName = resolvedCollector.name
    const amountStr = parsed.toFixed(2)

    if (kind === 'deposit') {
      advance.mutate(
        { collectorCode, amount: parsed, notes: notesTrimmed },
        {
          onSuccess: (res) => {
            onSuccess?.({
              kind,
              code: res.ledgerEntry.code,
              balance: res.actorBalance,
              collectorName,
              amount: amountStr,
              recordedAt: res.ledgerEntry.createdAt,
              notes: notesTrimmed
            })
            handleClose()
          },
          onError: (e) => {
            setFormError(e instanceof ApiError ? e.message : e.message)
          }
        }
      )
      return
    }

    remit.mutate(
      { collectorCode, amount: parsed, notes: notesTrimmed },
      {
        onSuccess: (res) => {
          onSuccess?.({
            kind,
            code: res.ledgerEntry.code,
            balance: res.actorBalance,
            collectorName,
            amount: amountStr,
            recordedAt: res.ledgerEntry.createdAt,
            notes: notesTrimmed
          })
          handleClose()
        },
        onError: (e) => {
          setFormError(e instanceof ApiError ? e.message : e.message)
        }
      }
    )
  }

  return (
    <dialog
      ref={dialogRef}
      className={cn(nativeModalDialogClassName(), 'max-w-md')}
      onCancel={(e) => {
        e.preventDefault()
        handleClose()
      }}
      onClose={() => {
        if (!pending) handleClose()
      }}
    >
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {kind === 'deposit'
            ? 'Cash received from a collector — increases your drawer balance.'
            : 'Cash returned to a collector — decreases your drawer balance.'}
        </p>
      </div>

      <form
        className="space-y-4 px-4 py-4"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="cash-collector-scan">Collector (scan badge)</Label>
          <Input
            ref={scanInputRef}
            id="cash-collector-scan"
            name="collector-scan"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Scan collector barcode"
            value={collectorScan}
            disabled={pending}
            className="font-mono uppercase tracking-wide"
            onChange={(e) => {
              setFormError(null)
              setCollectorScan(sanitizeCollectorCodeInput(e.target.value))
            }}
          />
          <p className="text-[11px] text-muted-foreground">
            Focus here and scan the collector badge. Press Enter if your scanner does not send it
            automatically.
          </p>
          {scanComplete && collectorLookup.isFetching ? (
            <p className="text-xs text-muted-foreground">Looking up collector…</p>
          ) : null}
          {scanComplete && resolvedCollector ? (
            <p className="text-sm font-medium">
              {resolvedCollector.name}
              {!resolvedCollector.isActive ? (
                <span className="ml-2 text-destructive">(inactive)</span>
              ) : null}
            </p>
          ) : null}
          {scanComplete && collectorLookup.isError ? (
            <p className="text-xs text-destructive">
              {collectorLookup.error instanceof ApiError
                ? collectorLookup.error.message
                : 'No collector matches that barcode.'}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cash-amount">Amount</Label>
          <Input
            id="cash-amount"
            name="transaction-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            placeholder="0.00"
            value={amount}
            disabled={pending}
            className="tabular-nums"
            onChange={(e) => {
              setFormError(null)
              setAmount(sanitizeStakeInput(e.target.value))
            }}
          />
          <p className="text-[11px] text-muted-foreground">
            Digits only (and one decimal for centavos). Letters and symbols are ignored.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cash-notes">Notes (optional)</Label>
          <Input
            id="cash-notes"
            name="transaction-notes"
            type="text"
            autoComplete="off"
            maxLength={200}
            value={notes}
            disabled={pending}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="-mx-4 flex justify-end gap-2 border-t px-4 pt-3">
          <Button type="button" variant="outline" disabled={pending} onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : kind === 'deposit' ? 'Record deposit' : 'Record remittance'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
