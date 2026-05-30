import { useEffect, useLayoutEffect, useRef } from 'react'
import { toast } from 'sonner'
import JsBarcode from 'jsbarcode'

import { Button } from '@/components/ui/button'
import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'
import { printCollectorBadge } from '@/lib/print-collector-badge'
import type { Collector } from '@/types/api'

export interface BarcodePrintDialogProps {
  collector: Collector | null
  onClose: () => void
}

export function BarcodePrintDialog({ collector, onClose }: BarcodePrintDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (collector) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [collector])

  useLayoutEffect(() => {
    if (!collector || !canvasRef.current) return
    const canvas = canvasRef.current
    JsBarcode(canvas, collector.code, {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 15,
      margin: 12,
      background: '#ffffff'
    })
  }, [collector?.id, collector?.code])

  async function handlePrint() {
    if (!collector || !canvasRef.current) return
    const ok = await printCollectorBadge({
      collector,
      barcodePngDataUrl: canvasRef.current.toDataURL('image/png')
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
      {collector ? (
        <div className="flex flex-col">
          <div className="border-b px-6 py-4 text-center">
            <h2 className="text-lg font-semibold tracking-tight">Print badge</h2>
            <p className="mt-1 text-sm text-muted-foreground">{collector.name}</p>
            <p className="mt-0.5 font-mono text-sm font-medium text-foreground">{collector.code}</p>
          </div>
          <div className="flex flex-col items-center gap-4 px-6 py-6">
            <canvas ref={canvasRef} key={collector.id} className="max-w-full" />
            <p className="text-center text-xs text-muted-foreground">
              80mm thermal layout. On the server PC with Electron, prints silently to the default
              printer. In a browser, opens a print preview. Cancel returns without printing.
            </p>
            <div className="flex w-full flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handlePrint}>
                Print
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
