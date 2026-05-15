import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'

export interface CancelFightDialogProps {
  open: boolean
  fightNumber: number
  isPending: boolean
  onClose: () => void
  onConfirm: (reason: string | undefined) => void
}

export function CancelFightDialog({
  open,
  fightNumber,
  isPending,
  onClose,
  onConfirm
}: CancelFightDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const reasonRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={nativeModalDialogClassName()}
      onCancel={(e) => {
        e.preventDefault()
        if (!isPending) onClose()
      }}
      onClose={onClose}
    >
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Cancel fight #{fightNumber}?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pending bets are refunded. This cannot be used after a fight is settled.
        </p>
      </div>
      <div className="space-y-3 px-4 py-3">
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Reason (optional)</Label>
          <Input
            ref={reasonRef}
            id="cancel-reason"
            key={`${open}-${fightNumber}`}
            defaultValue=""
            disabled={isPending}
            maxLength={200}
            placeholder="Short note for the audit log"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t px-4 py-3">
        <Button type="button" variant="outline" disabled={isPending} onClick={onClose}>
          Back
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={() =>
            onConfirm(reasonRef.current?.value.trim() || undefined)
          }
        >
          {isPending ? 'Cancelling…' : 'Cancel fight'}
        </Button>
      </div>
    </dialog>
  )
}
