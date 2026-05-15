import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'

export interface FightSimpleConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  /** `destructive` for close betting / cancel-style actions. */
  confirmVariant?: 'default' | 'destructive'
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

export function FightSimpleConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = 'default',
  isPending,
  onClose,
  onConfirm
}: FightSimpleConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

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
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex justify-end gap-2 border-t px-4 py-3">
        <Button type="button" variant="outline" disabled={isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={isPending}
          variant={confirmVariant === 'destructive' ? 'destructive' : 'default'}
          onClick={onConfirm}
        >
          {isPending ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
