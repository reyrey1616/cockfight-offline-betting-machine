import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BET_SIDE_LABEL } from '@/constants'
import { formatMoney } from '@/lib/format-money'
import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'
import { cn } from '@/lib/utils'
import type { BetRow } from '@/types/api'

export interface TellerVoidBetDialogProps {
  bet: BetRow | null
  fightNumber: number | null
  pending: boolean
  onClose: () => void
  onConfirm: (reason: string | undefined) => void
}

export function TellerVoidBetDialog({
  bet,
  fightNumber,
  pending,
  onClose,
  onConfirm
}: TellerVoidBetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState('')

  const open = bet != null

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
    if (open) setReason('')
  }, [open, bet?.id])

  function handleClose() {
    if (pending) return
    setReason('')
    onClose()
  }

  if (!bet) return null

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
        <h2 className="text-lg font-semibold">Cancel ticket?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {fightNumber != null
            ? `Void ${bet.code} on fight #${fightNumber}. Cash returns to your drawer; pools and odds update.`
            : `Void ${bet.code}. Cash returns to your drawer.`}
        </p>
      </div>

      <form
        className="space-y-4 px-4 py-4"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault()
          if (!pending) onConfirm(reason.trim() || undefined)
        }}
      >
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Ticket</span>
            <span className="font-mono font-semibold">{bet.code}</span>
          </div>
          <div className="mt-1 flex justify-between gap-2">
            <span className="text-muted-foreground">Side</span>
            <span className="font-medium">{BET_SIDE_LABEL[bet.side]}</span>
          </div>
          <div className="mt-1 flex justify-between gap-2">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold tabular-nums">{formatMoney(bet.amount)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="void-reason">Reason (optional)</Label>
          <Input
            id="void-reason"
            type="text"
            maxLength={200}
            autoComplete="off"
            disabled={pending}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. wrong amount, customer changed mind"
          />
        </div>

        <div className="-mx-4 flex justify-end gap-2 border-t px-4 pt-3">
          <Button type="button" variant="outline" disabled={pending} onClick={handleClose}>
            Keep ticket
          </Button>
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending ? 'Cancelling…' : 'Cancel ticket'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
