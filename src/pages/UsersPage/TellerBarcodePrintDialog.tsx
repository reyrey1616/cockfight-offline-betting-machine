import { useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useTellerLoginBarcode } from '@/hooks/useUsers'
import { ApiError } from '@/lib/api'
import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'
import { printTellerBadge } from '@/lib/print-teller-badge'
import { credentialToBarcodeDataUrl } from '@/lib/render-ticket-barcode'
import type { AdminUser } from '@/types/api'

export interface TellerBarcodePrintDialogProps {
  teller: AdminUser | null
  onClose: () => void
}

export function TellerBarcodePrintDialog({ teller, onClose }: TellerBarcodePrintDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { data, isPending, isError, error } = useTellerLoginBarcode(teller?.id)

  const previewDataUrl = useMemo(
    () => (data ? credentialToBarcodeDataUrl(data.barcodeValue) : null),
    [data]
  )

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (teller) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [teller])

  const loadMessage = error instanceof ApiError ? error.message : error?.message

  async function handlePrint() {
    if (!data || !previewDataUrl) return
    const ok = await printTellerBadge({
      teller: data,
      barcodePngDataUrl: previewDataUrl
    })
    if (!ok) {
      toast.error(
        window.electronAPI?.isElectron
          ? 'Print failed. Check the default printer and config.json.'
          : 'Print failed. Allow pop-ups for this site or use the Cockfight desktop app on the server PC.'
      )
      return
    }
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className={nativeModalDialogClassName()}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClose={() => {
        onClose()
      }}
    >
      {teller ? (
        <div className="flex flex-col">
          <div className="border-b px-6 py-4 text-center">
            <h2 className="text-lg font-semibold tracking-tight">Print login badge</h2>
            <p className="mt-1 text-sm text-muted-foreground">{teller.fullName}</p>
            <p className="mt-0.5 font-mono text-sm font-medium text-foreground">
              {teller.username} · {teller.initials}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4 px-6 py-6">
            {isError ? (
              <Alert variant="destructive" className="w-full">
                <AlertTitle>Could not load barcode</AlertTitle>
                <AlertDescription>{loadMessage ?? 'Something went wrong.'}</AlertDescription>
              </Alert>
            ) : isPending || !data ? (
              <p className="w-full text-sm text-muted-foreground">Loading barcode…</p>
            ) : (
              <>
                {previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Teller login barcode"
                    className="max-h-32 max-w-full object-contain"
                  />
                ) : null}
                <p className="text-center text-xs text-muted-foreground">
                  CODE128 encodes the teller login password. The password is not shown on
                  screen — print a copy for the pit desk. 80mm thermal layout; on Electron,
                  prints silently to the default printer.
                </p>
                <div className="flex w-full flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handlePrint}>
                    Print
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
