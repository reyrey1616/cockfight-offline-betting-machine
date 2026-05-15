import { useEffect, useRef, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'
import { parseStakeInput, sanitizeStakeInput } from '@/lib/teller-stake'
import { cn } from '@/lib/utils'
import { useCashAdvance, useCashRemit } from '@/hooks/useCash'
import { useCollectorsList } from '@/hooks/useCollectors'
import type { Collector } from '@/types/api'

export type CashTransactionKind = 'deposit' | 'remit'

export interface TellerCashTransactionDialogProps {
  kind: CashTransactionKind | null
  onClose: () => void
  onSuccess?: (args: { kind: CashTransactionKind; code: string | null; balance: string }) => void
}

export function TellerCashTransactionDialog({
  kind,
  onClose,
  onSuccess
}: TellerCashTransactionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [collectorId, setCollectorId] = useState('')
  const [amount, setAmount] = useState('')
  const [password, setPassword] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const collectorsQuery = useCollectorsList()
  const advance = useCashAdvance()
  const remit = useCashRemit()
  const pending = advance.isPending || remit.isPending

  const open = kind != null
  const title = kind === 'deposit' ? 'Record deposit' : kind === 'remit' ? 'Record remittance' : ''
  const collectors: Collector[] = collectorsQuery.data?.collectors ?? []

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [open])

  function resetForm() {
    setCollectorId('')
    setAmount('')
    setPassword('')
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
    if (!collectorId) {
      setFormError('Select a collector.')
      return
    }
    if (parsed == null) {
      setFormError('Enter a valid amount greater than zero (max 2 decimal places).')
      return
    }
    if (!password.trim()) {
      setFormError('Enter your password to confirm.')
      return
    }

    setFormError(null)
    const notesTrimmed = notes.trim() || undefined
    const passwordValue = password

    if (kind === 'deposit') {
      advance.mutate(
        { collectorId, amount: parsed, password: passwordValue, notes: notesTrimmed },
        {
          onSuccess: (res) => {
            onSuccess?.({
              kind,
              code: res.ledgerEntry.code,
              balance: res.actorBalance
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
      { collectorId, amount: parsed, password: passwordValue, notes: notesTrimmed },
      {
        onSuccess: (res) => {
          onSuccess?.({
            kind,
            code: res.ledgerEntry.code,
            balance: res.actorBalance
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
        {collectorsQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load collectors</AlertTitle>
            <AlertDescription>Try again in a moment.</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="cash-collector">Collector</Label>
          <select
            id="cash-collector"
            name="collector-id"
            autoComplete="off"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={collectorId}
            disabled={pending || collectorsQuery.isPending}
            onChange={(e) => {
              setFormError(null)
              setCollectorId(e.target.value)
            }}
          >
            <option value="">Select collector…</option>
            {collectors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
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
          <Label htmlFor="cash-confirm">Confirm with your password</Label>
          <Input
            id="cash-confirm"
            name="cash-step-up"
            type="password"
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore
            value={password}
            disabled={pending}
            onChange={(e) => {
              setFormError(null)
              setPassword(e.target.value)
            }}
          />
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
