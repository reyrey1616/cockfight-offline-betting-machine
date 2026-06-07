// Admin > Settings — house commission (tong) for fights created after each change.

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
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { ApiError } from '@/lib/api'
import type { Setting } from '@/types/api'

import { SessionResetSection } from './SessionResetSection'
import { AdminVoidBarcodeSection } from './AdminVoidBarcodeSection'

const MAX_COMMISSION_PERCENT = 30
const MIN_COMMISSION_PERCENT = 0

function fractionStringToPercentString(rate: string): string {
  const n = Number.parseFloat(rate)
  if (Number.isNaN(n)) return ''
  const pct = n * 100
  return String(Math.round(pct * 100) / 100)
}

function percentInputToFraction(percentStr: string): number | null {
  const trimmed = percentStr.trim().replace(',', '.')
  if (trimmed === '') return null
  const pct = Number.parseFloat(trimmed)
  if (Number.isNaN(pct)) return null
  return Math.round((pct / 100) * 10_000) / 10_000
}

function validatePercentInput(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed === '') return 'Enter a commission percentage.'
  const pct = Number.parseFloat(trimmed.replace(',', '.'))
  if (Number.isNaN(pct)) return 'Use a number (e.g. 10 or 12.5).'
  if (pct < MIN_COMMISSION_PERCENT || pct > MAX_COMMISSION_PERCENT) {
    return `Commission must be between ${MIN_COMMISSION_PERCENT}% and ${MAX_COMMISSION_PERCENT}%.`
  }
  return null
}

function CommissionForm({ setting }: { setting: Setting }) {
  const [percentInput, setPercentInput] = useState(() =>
    fractionStringToPercentString(setting.commissionRate)
  )
  const [clientError, setClientError] = useState<string | null>(null)

  const { mutate, isPending: savePending, error: saveError } = useUpdateSettings()

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setClientError(null)

    const msg = validatePercentInput(percentInput)
    if (msg) {
      setClientError(msg)
      return
    }

    const fraction = percentInputToFraction(percentInput)
    if (fraction === null) {
      setClientError('Could not read that percentage.')
      return
    }

    mutate(
      { commissionRate: fraction },
      {
        onSuccess: (res) => {
          const p = fractionStringToPercentString(res.setting.commissionRate)
          toast.success('Commission updated', {
            description: `New rate ${p}% applies to fights created from now on.`
          })
        }
      }
    )
  }

  const saveMessage =
    saveError instanceof ApiError ? saveError.message : saveError?.message

  const updatedLabel = new Date(setting.updatedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">Last saved {updatedLabel}.</p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="commission-percent">House commission (%)</Label>
        <Input
          id="commission-percent"
          name="commissionPercent"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          required
          value={percentInput}
          onChange={(e) => {
            setClientError(null)
            setPercentInput(e.target.value)
          }}
          disabled={savePending}
          placeholder="e.g. 10"
        />
        {clientError ? (
          <p className="text-sm text-destructive">{clientError}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Current wire value:{' '}
            <span className="font-mono text-foreground">{setting.commissionRate}</span> (fraction
            of the losing pool per fight snapshot).
          </p>
        )}
      </div>

      {saveMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={savePending}>
        {savePending ? 'Saving…' : 'Save commission'}
      </Button>
    </form>
  )
}

export function SettingsPage() {
  const { data, isPending: loadPending, isError, error } = useSettings()

  const loadMessage =
    error instanceof ApiError ? error.message : error?.message

  const setting = data?.setting

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          House commission (tong) is stored as a share of the losing pool. Each fight keeps the
          rate from when it was opened — changing it here only affects new fights.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="max-w-md lg:max-w-none">
          <CardHeader>
            <CardTitle>Commission rate</CardTitle>
            <CardDescription>
              Enter a whole or decimal percent between 0% and 30%. The server rounds to four
              decimal places as a fraction (e.g. 12.5% → 0.1250).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <Alert variant="destructive">
                <AlertTitle>Could not load settings</AlertTitle>
                <AlertDescription>{loadMessage ?? 'Something went wrong.'}</AlertDescription>
              </Alert>
            ) : loadPending ? (
              <p className="text-sm text-muted-foreground">Loading current rate…</p>
            ) : setting ? (
              <CommissionForm
                key={`${setting.commissionRate}-${setting.updatedAt}`}
                setting={setting}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No settings returned.</p>
            )}
          </CardContent>
        </Card>

        <AdminVoidBarcodeSection />
      </div>

      <SessionResetSection />
    </div>
  )
}
