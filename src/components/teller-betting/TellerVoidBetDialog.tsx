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
  authError: string | null
  onClose: () => void
  onConfirm: (adminPassword: string) => void
}

export function TellerVoidBetDialog({
  bet,
  fightNumber,
  pending,
  authError,
  onClose,
  onConfirm
}: TellerVoidBetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const adminInputRef = useRef<HTMLInputElement>(null)
  const [adminPassword, setAdminPassword] = useState('')

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
    if (!open) return
    setAdminPassword('')
    requestAnimationFrame(() => {
      adminInputRef.current?.focus()
      adminInputRef.current?.select()
    })
  }, [open, bet?.id])

  useEffect(() => {
    if (!open || !authError) return
    setAdminPassword('')
    requestAnimationFrame(() => {
      adminInputRef.current?.focus()
    })
  }, [authError, open])

  function handleClose() {
    if (pending) return
    setAdminPassword('')
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
            ? `Void ${bet.code} on fight #${fightNumber}. Scan the admin void barcode to authorize.`
            : `Void ${bet.code}. Scan the admin void barcode to authorize.`}
        </p>
      </div>

      <form
        className="space-y-4 px-4 py-4"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault()
          if (pending || !adminPassword.trim()) return
          onConfirm(adminPassword)
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
          <Label htmlFor="void-admin-password">Admin authorization</Label>
          <Input
            ref={adminInputRef}
            id="void-admin-password"
            type="password"
            autoComplete="off"
            disabled={pending}
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Scan admin void barcode"
          />
          <p className="text-xs text-muted-foreground">
            Focus here and scan the admin barcode from Settings. Press Enter if your scanner does
            not submit automatically.
          </p>
          {authError ? <p className="text-sm text-destructive">{authError}</p> : null}
        </div>

        <div className="-mx-4 flex justify-end gap-2 border-t px-4 pt-3">
          <Button type="button" variant="outline" disabled={pending} onClick={handleClose}>
            Keep ticket
          </Button>
          <Button type="submit" variant="destructive" disabled={pending || !adminPassword.trim()}>
            {pending ? 'Cancelling…' : 'Cancel ticket'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
