// Admin > Collectors — active badge list, barcode preview + print, rename, remove from list.
//
// Validation mirrors `collectors.service.js` / schemas; the API is source of truth.
// “Delete” calls PATCH `isActive: false` (no hard DELETE on the server); this view only loads
// active collectors so the row disappears after delete.

import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCollectorsList,
  useCreateCollector,
  useUpdateCollector
} from '@/hooks/useCollectors'
import { ApiError } from '@/lib/api'
import {
  getCreateCollectorNameError,
  normalizeCollectorName
} from '@/lib/validators/collector-name'
import type { Collector } from '@/types/api'

import { BarcodePrintDialog } from './BarcodePrintDialog'
import { CollectorsTable } from './CollectorsTable'
import { DeleteCollectorDialog } from './DeleteCollectorDialog'
import { EditCollectorDialog } from './EditCollectorDialog'

export function CollectorsPage() {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | undefined>()
  const [editing, setEditing] = useState<Collector | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Collector | null>(null)
  const [barcodePreview, setBarcodePreview] = useState<Collector | null>(null)

  const { data, isPending: listLoading, isError, error: listError, refetch } =
    useCollectorsList()
  const { mutate, isPending, error } = useCreateCollector()
  const { mutate: patchCollector, isPending: patchPending } = useUpdateCollector()

  function clearNameFeedback() {
    setNameError(undefined)
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const err = getCreateCollectorNameError(name)
    setNameError(err)
    if (err) return

    const normalized = normalizeCollectorName(name)
    mutate(
      { name: normalized },
      {
        onSuccess: (res) => {
          setName('')
          setNameError(undefined)
          toast.success(`“${res.collector.name}” is on the list`, {
            description: `Badge code ${res.collector.code}. Open Barcode to preview and print.`
          })
        }
      }
    )
  }

  const apiMessage =
    error instanceof ApiError ? error.message : error?.message

  const listMessage =
    listError instanceof ApiError ? listError.message : listError?.message

  const collectors = data?.collectors ?? []

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Collectors</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Each active collector has a COL barcode for cash slips. Use{' '}
          <span className="font-medium text-foreground">Barcode</span> to preview and print.
          Delete removes them from this list; ledger history stays on the server.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-start">
        <CollectorsTable
          collectors={collectors}
          listLoading={listLoading}
          isError={isError}
          listMessage={listMessage}
          onRefresh={() => void refetch()}
          deletePending={patchPending}
          onEdit={setEditing}
          onDeleteClick={setDeleteTarget}
          onOpenBarcodePrint={setBarcodePreview}
        />

        <Card className="max-w-md lg:max-w-none">
          <CardHeader>
            <CardTitle>Add collector</CardTitle>
            <CardDescription>
              Enter their display name. The system creates an 8-character COL code; print it from
              the table when the badge is ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="collector-name">Display name</Label>
                <Input
                  id="collector-name"
                  name="name"
                  autoComplete="organization"
                  required
                  value={name}
                  onChange={(e) => {
                    clearNameFeedback()
                    setName(e.target.value)
                  }}
                  disabled={isPending}
                  maxLength={80}
                  placeholder="e.g. Pedro Santos"
                />
                {nameError ? (
                  <p className="text-sm text-destructive">{nameError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    2–80 characters after trimming; multiple spaces are collapsed (same as
                    server).
                  </p>
                )}
              </div>

              {apiMessage ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not add collector</AlertTitle>
                  <AlertDescription>{apiMessage}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Add collector'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <EditCollectorDialog collector={editing} onClose={() => setEditing(null)} />
      <BarcodePrintDialog collector={barcodePreview} onClose={() => setBarcodePreview(null)} />
      <DeleteCollectorDialog
        collector={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        isDeleting={patchPending}
        onConfirm={() => {
          if (!deleteTarget) return
          patchCollector(
            { id: deleteTarget.id, body: { isActive: false } },
            {
              onSuccess: () => {
                toast.success(`Removed “${deleteTarget.name}” from the list.`)
                setDeleteTarget(null)
              },
              onError: (err) => {
                const msg =
                  err instanceof ApiError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : 'Request failed.'
                toast.error(msg)
              }
            }
          )
        }}
      />
    </div>
  )
}
