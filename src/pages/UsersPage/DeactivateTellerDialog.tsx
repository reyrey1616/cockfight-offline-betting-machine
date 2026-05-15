import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import type { AdminUser } from '@/types/api'

import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'

export interface DeactivateTellerDialogProps {
  user: AdminUser | null
  onClose: () => void
  isConfirming: boolean
  onConfirm: () => void
}

export function DeactivateTellerDialog({
  user,
  onClose,
  isConfirming,
  onConfirm
}: DeactivateTellerDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (user) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [user])

  return (
    <dialog
      ref={ref}
      className={nativeModalDialogClassName()}
      onCancel={(e) => {
        e.preventDefault()
        if (!isConfirming) onClose()
      }}
      onClose={() => {
        onClose()
      }}
    >
      <div className="flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Turn off access?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{user?.fullName}</span> (
            {user?.username}) will not be able to sign in until an admin turns access
            back on. Their history stays on file for audit.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Saving…' : 'Turn off access'}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
