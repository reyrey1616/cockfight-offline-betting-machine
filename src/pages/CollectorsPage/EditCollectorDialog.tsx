import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateCollector } from '@/hooks/useCollectors'
import { ApiError } from '@/lib/api'
import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'
import {
  getCreateCollectorNameError,
  normalizeCollectorName
} from '@/lib/validators/collector-name'
import type { Collector, UpdateCollectorRequest } from '@/types/api'

export interface EditCollectorDialogProps {
  collector: Collector | null
  onClose: () => void
}

function EditCollectorForm({
  collector,
  onClose,
  updateMut
}: {
  collector: Collector
  onClose: () => void
  updateMut: ReturnType<typeof useUpdateCollector>
}) {
  const [name, setName] = useState(collector.name)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const saving = updateMut.isPending

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldError(null)

    const err = getCreateCollectorNameError(name)
    if (err) {
      setFieldError(err)
      return
    }

    const normalized = normalizeCollectorName(name)
    const patch: UpdateCollectorRequest = {}
    if (normalized !== collector.name) patch.name = normalized

    if (Object.keys(patch).length === 0) {
      toast.message('No changes to save.')
      onClose()
      return
    }

    try {
      await updateMut.mutateAsync({ id: collector.id, body: patch })
      toast.success(`Saved “${collector.code}”.`)
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
        <h2 className="text-lg font-semibold tracking-tight">Edit collector</h2>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{collector.code}</p>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-collector-name">Display name</Label>
          <Input
            id="edit-collector-name"
            name="name"
            autoComplete="organization"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            maxLength={80}
          />
          <p className="text-xs text-muted-foreground">
            2–80 characters after trimming; spaces are collapsed the same way as when creating.
            To remove someone from this list, use Delete in the table.
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

export function EditCollectorDialog({ collector, onClose }: EditCollectorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const updateMut = useUpdateCollector()
  const saving = updateMut.isPending

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (collector) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [collector])

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
      {collector ? (
        <EditCollectorForm
          key={collector.id}
          collector={collector}
          onClose={onClose}
          updateMut={updateMut}
        />
      ) : null}
    </dialog>
  )
}
