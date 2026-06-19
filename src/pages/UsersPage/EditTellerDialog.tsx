import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResetUserPassword, useUpdateUser } from '@/hooks/useUsers'
import { ApiError } from '@/lib/api'
import type { AdminUser, UpdateUserRequest } from '@/types/api'

import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'

export interface EditTellerDialogProps {
  user: AdminUser | null
  currentUserId: string | undefined
  onClose: () => void
}

function EditTellerForm({
  user,
  currentUserId,
  onClose,
  updateMut,
  resetMut
}: {
  user: AdminUser
  currentUserId: string | undefined
  onClose: () => void
  updateMut: ReturnType<typeof useUpdateUser>
  resetMut: ReturnType<typeof useResetUserPassword>
}) {
  const [fullName, setFullName] = useState(user.fullName)
  const [isActive, setIsActive] = useState(user.isActive)
  const [newPassword, setNewPassword] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const saving = updateMut.isPending || resetMut.isPending
  const isSelf = user.id === currentUserId
  const accessOn = isSelf ? true : isActive

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldError(null)

    const trimmed = fullName.trim()
    if (trimmed.length < 1) {
      setFieldError('Full name is required.')
      return
    }
    if (trimmed.length > 100) {
      setFieldError('Full name must be at most 100 characters.')
      return
    }

    const pw = newPassword.trim()
    if (pw.length > 0 && (pw.length < 8 || pw.length > 256)) {
      setFieldError('New password must be between 8 and 256 characters, or leave blank.')
      return
    }

    const patch: UpdateUserRequest = {}
    if (trimmed !== user.fullName) patch.fullName = trimmed
    if (!isSelf && accessOn !== user.isActive) patch.isActive = accessOn

    const hasPatch = Object.keys(patch).length > 0
    const hasPassword = pw.length > 0

    if (!hasPatch && !hasPassword) {
      toast.message('No changes to save.')
      onClose()
      return
    }

    try {
      if (hasPatch) {
        await updateMut.mutateAsync({ id: user.id, body: patch })
      }
      if (hasPassword) {
        await resetMut.mutateAsync({ id: user.id, newPassword: pw })
      }
      toast.success(`Saved changes for “${user.username}”.`)
      onClose()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Request failed.'
      toast.error(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold tracking-tight">Edit teller</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Username <span className="font-medium text-foreground">{user.username}</span> · ticket
          initials <span className="font-mono font-medium text-foreground">{user.initials}</span>
        </p>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-fullname">Full name</Label>
          <Input
            id="edit-fullname"
            name="fullName"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={saving}
            maxLength={100}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              id="edit-active"
              name="isActive"
              type="checkbox"
              checked={accessOn}
              onChange={(e) => {
                if (!isSelf) setIsActive(e.target.checked)
              }}
              disabled={saving || isSelf}
              className="size-4 rounded border border-input accent-foreground"
            />
            <Label htmlFor="edit-active" className="cursor-pointer font-normal leading-none">
              Can sign in at this kiosk
            </Label>
          </div>
          {isSelf ? (
            <p className="text-xs text-muted-foreground">
              You cannot remove your own access while you are signed in here.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Turn this off if they should not log in anymore. You can turn it back on later.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-password">New password (optional)</Label>
          <Input
            id="edit-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={saving}
            minLength={8}
            maxLength={256}
            placeholder="Leave blank to keep current password"
          />
          <p className="text-xs text-muted-foreground">
            If you set a password, reprint their Barcode badge so the slip matches.
          </p>
        </div>

        {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export function EditTellerDialog({ user, currentUserId, onClose }: EditTellerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const updateMut = useUpdateUser()
  const resetMut = useResetUserPassword()
  const saving = updateMut.isPending || resetMut.isPending

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (user) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [user])

  return (
    <dialog
      ref={dialogRef}
      className={nativeModalDialogClassName()}
      onCancel={(e) => {
        if (saving) e.preventDefault()
      }}
      onClose={() => {
        onClose()
      }}
    >
      {user ? (
        <EditTellerForm
          key={user.id}
          user={user}
          currentUserId={currentUserId}
          onClose={onClose}
          updateMut={updateMut}
          resetMut={resetMut}
        />
      ) : null}
    </dialog>
  )
}
