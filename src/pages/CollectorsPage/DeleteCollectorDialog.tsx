import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'
import type { Collector } from '@/types/api'

export interface DeleteCollectorDialogProps {
  collector: Collector | null
  onClose: () => void
  isDeleting: boolean
  onConfirm: () => void
}

export function DeleteCollectorDialog({
  collector,
  onClose,
  isDeleting,
  onConfirm
}: DeleteCollectorDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (collector) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [collector])

  return (
    <dialog
      ref={ref}
      className={nativeModalDialogClassName()}
      onCancel={(e) => {
        e.preventDefault()
        if (!isDeleting) onClose()
      }}
      onClose={() => {
        onClose()
      }}
    >
      <div className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Delete from this list?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{collector?.name}</span> (
            <span className="font-mono">{collector?.code}</span>) will disappear from the
            collectors table and cannot be picked on new cash slips. Past transactions stay in
            the books for audit — the server does not erase that history.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
