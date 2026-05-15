import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SESSION_RESET_CONFIRM_TEXT } from '@/constants'
import { useResetSession, useSessionResetPreview } from '@/hooks/useSession'
import { ApiError } from '@/lib/api'
import { formatMoney } from '@/lib/format-money'
import { cn } from '@/lib/utils'
import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'
import type { SessionPreviewResponse } from '@/types/api'

export interface SessionResetDialogProps {
  open: boolean
  onClose: () => void
}

function PreviewSummary({ preview }: { preview: SessionPreviewResponse }) {
  const { counts, invariants, canResetCleanly } = preview
  const tellers = invariants.nonZeroBalances.tellers ?? []

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">
        This clears the current event’s transactional data only. It does not remove teller accounts,
        collector names, passwords, or who can sign in.
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Will be deleted:</span>
      </p>
      <ul className="list-inside list-disc space-y-1 text-foreground">
        <li>
          <span className="font-medium">{counts.fights}</span> fights
        </li>
        <li>
          <span className="font-medium">{counts.bets}</span> bets (tickets)
        </li>
        <li>
          <span className="font-medium">{counts.collectorCash}</span> collector cash slips —{' '}
          <span className="font-medium">cash advances (deposits)</span> from collectors and{' '}
          <span className="font-medium">remits</span> back to collectors
        </li>
      </ul>
      <p className="rounded-md border bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Kept:</span> teller logins and passwords,
        collector directory, house commission setting, and this reset history.
      </p>
      {!canResetCleanly ? (
        <Alert variant="destructive">
          <AlertTitle>Pre-flight checks failed</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Resolve these or enable “Force reset” below to wipe anyway (recorded in the audit log).
            </p>
            <ul className="list-inside list-disc text-xs">
              {invariants.unfinishedFights.violated ? (
                <li>
                  {invariants.unfinishedFights.count} open or closed fight(s) still in progress
                </li>
              ) : null}
              {invariants.unpaidWinningBets.violated ? (
                <li>{invariants.unpaidWinningBets.count} winning ticket(s) not yet paid out</li>
              ) : null}
              {invariants.nonZeroBalances.violated ? (
                <li>
                  {invariants.nonZeroBalances.tellerCount} teller(s) with non-zero cash balance
                </li>
              ) : null}
            </ul>
            {tellers.length > 0 ? (
              <ul className="mt-2 max-h-28 overflow-y-auto rounded border bg-background/80 p-2 text-xs">
                {tellers.map((t) => (
                  <li key={t.tellerId} className="flex justify-between gap-2 py-0.5">
                    <span>
                      {t.fullName} ({t.username})
                    </span>
                    <span className="tabular-nums font-medium">{formatMoney(t.balance)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : (
        <p className="text-xs text-muted-foreground">
          All pre-flight checks passed — a clean reset is allowed.
        </p>
      )}
    </div>
  )
}

export function SessionResetDialog({ open, onClose }: SessionResetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [notes, setNotes] = useState('')
  const [force, setForce] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const previewQuery = useSessionResetPreview(open)
  const { mutate: runReset, isPending } = useResetSession()

  const preview = previewQuery.data
  const needsForce = preview != null && !preview.canResetCleanly

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
    setPassword('')
    setConfirmText('')
    setNotes('')
    setForce(false)
    setFormError(null)
  }

  function handleClose() {
    if (isPending) return
    resetForm()
    onClose()
  }

  function handleSubmit() {
    if (!password.trim()) {
      setFormError('Enter your admin password.')
      return
    }
    if (confirmText.trim() !== SESSION_RESET_CONFIRM_TEXT) {
      setFormError(`Type ${SESSION_RESET_CONFIRM_TEXT} exactly to confirm.`)
      return
    }
    if (needsForce && !force) {
      setFormError('Enable force reset or resolve the issues listed above.')
      return
    }

    setFormError(null)
    runReset(
      {
        password,
        notes: notes.trim() || undefined,
        force: needsForce ? force : false,
      },
      {
        onSuccess: (res) => {
          const r = res.sessionReset
          const collector =
            r.collectorCashCount != null
              ? `${r.collectorCashCount} collector cash slips`
              : 'collector cash cleared'
          handleClose()
          toast.success('Session reset complete', {
            description: `Removed ${r.fightCount} fights, ${r.betCount} bets, ${collector}.`,
          })
        },
        onError: (e) => {
          const msg =
            e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Reset failed.'
          setFormError(msg)
        },
      }
    )
  }

  return (
    <dialog
      ref={dialogRef}
      className={cn(nativeModalDialogClassName(), 'max-w-lg')}
      onCancel={(e) => {
        e.preventDefault()
        handleClose()
      }}
      onClose={() => {
        if (!isPending) handleClose()
      }}
    >
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold text-destructive">Reset session</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          End-of-night wipe — cannot be undone. Re-enter your password to continue.
        </p>
      </div>

      <div className="space-y-4 px-4 py-4">
        {previewQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading preview…</p>
        ) : previewQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load preview</AlertTitle>
            <AlertDescription>
              {previewQuery.error instanceof ApiError
                ? previewQuery.error.message
                : 'Request failed.'}
            </AlertDescription>
          </Alert>
        ) : preview ? (
          <PreviewSummary preview={preview} />
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="session-reset-password">Your password</Label>
          <Input
            id="session-reset-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setFormError(null)
              setPassword(e.target.value)
            }}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="session-reset-confirm">
            Type <span className="font-mono font-semibold">{SESSION_RESET_CONFIRM_TEXT}</span> to
            confirm
          </Label>
          <Input
            id="session-reset-confirm"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={confirmText}
            onChange={(e) => {
              setFormError(null)
              setConfirmText(e.target.value.toUpperCase())
            }}
            disabled={isPending}
            placeholder={SESSION_RESET_CONFIRM_TEXT}
            className="font-mono"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="session-reset-notes">Notes (optional)</Label>
          <Input
            id="session-reset-notes"
            type="text"
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            placeholder="e.g. End of event May 15"
          />
        </div>

        {needsForce ? (
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={force}
              onChange={(e) => {
                setFormError(null)
                setForce(e.target.checked)
              }}
              disabled={isPending}
            />
            <span>
              <span className="font-medium text-destructive">Force reset</span>
              <span className="block text-xs text-muted-foreground">
                Bypass open fights, unpaid winners, and non-zero teller balances. This is logged as a
                forced reset.
              </span>
            </span>
          </label>
        ) : null}

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Cannot reset</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 border-t px-4 py-3">
        <Button type="button" variant="outline" disabled={isPending} onClick={handleClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isPending || previewQuery.isLoading}
          onClick={handleSubmit}
        >
          {isPending ? 'Resetting…' : 'Reset session'}
        </Button>
      </div>
    </dialog>
  )
}
