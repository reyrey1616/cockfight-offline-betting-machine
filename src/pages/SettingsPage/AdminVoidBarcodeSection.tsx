import { useLayoutEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import JsBarcode from 'jsbarcode'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useAdminVoidBarcode } from '@/hooks/useAdminVoidBarcode'
import { ApiError } from '@/lib/api'
import { printAdminVoidBarcode } from '@/lib/print-admin-void-barcode'

export function AdminVoidBarcodeSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [printPending, setPrintPending] = useState(false)
  const { data, isPending, isError, error } = useAdminVoidBarcode()

  useLayoutEffect(() => {
    if (!data?.barcodeValue || !canvasRef.current) return
    JsBarcode(canvasRef.current, data.barcodeValue, {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: false,
      margin: 12,
      background: '#ffffff'
    })
  }, [data?.barcodeValue])

  const loadMessage = error instanceof ApiError ? error.message : error?.message

  async function handlePrint() {
    if (!data || !canvasRef.current) return
    setPrintPending(true)
    try {
      const ok = await printAdminVoidBarcode({
        username: data.username,
        barcodeValue: data.barcodeValue,
        barcodePngDataUrl: canvasRef.current.toDataURL('image/png')
      })
      if (!ok) {
        toast.error(
          'Print failed. Allow pop-ups for this site or use the Cockfight desktop app on the server PC.'
        )
      }
    } finally {
      setPrintPending(false)
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Admin void barcode</CardTitle>
        <CardDescription>
          CODE128 encodes the admin login password. Scan at the teller kiosk to authorize voiding
          bet tickets. The password is not shown on screen — print a copy for the pit desk.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isError ? (
          <Alert variant="destructive" className="w-full">
            <AlertTitle>Could not load barcode</AlertTitle>
            <AlertDescription>{loadMessage ?? 'Something went wrong.'}</AlertDescription>
          </Alert>
        ) : isPending ? (
          <p className="w-full text-sm text-muted-foreground">Loading barcode…</p>
        ) : data ? (
          <>
            <p className="w-full text-xs text-muted-foreground">
              Admin account: <span className="font-medium text-foreground">{data.username}</span>
            </p>
            <canvas ref={canvasRef} className="max-w-full rounded-md border bg-white" />
            <Button
              type="button"
              className="w-full"
              disabled={printPending}
              onClick={handlePrint}
            >
              {printPending ? 'Printing…' : 'Print barcode'}
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
