import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useSessionResets } from '@/hooks/useSession'
import type { SessionResetRow } from '@/types/api'

import { SessionResetDialog } from './SessionResetDialog'

function formatResetSummary(r: SessionResetRow): string {
  const collector =
    r.collectorCashCount != null
      ? `${r.collectorCashCount} collector cash slips (deposits & remits)`
      : 'collector deposits & remits cleared'
  return `${r.fightCount} fights, ${r.betCount} bets, ${collector}`
}

function fmtWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch {
    return iso
  }
}

/** Destructive end-of-night wipe — separate from commission settings. */
export function SessionResetSection() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: resetsData, isPending: resetsLoading } = useSessionResets(5)

  const recentResets = resetsData?.resets ?? []

  return (
    <>
      <Card className="max-w-lg border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Session reset</CardTitle>
          <CardDescription>
            Clears fights, bets, and collector cash slips (deposits and remits) for a fresh event.
            Teller accounts, collector list, passwords, and commission settings are not deleted.
            Every reset is logged permanently.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" variant="destructive" onClick={() => setDialogOpen(true)}>
            Reset session…
          </Button>

          {resetsLoading ? (
            <p className="text-xs text-muted-foreground">Loading recent resets…</p>
          ) : recentResets.length > 0 ? (
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent resets
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {recentResets.map((r) => (
                  <li key={r.id} className="rounded-md border bg-muted/30 px-2 py-1.5">
                    <div className="font-medium text-foreground">
                      {fmtWhen(r.performedAt)}
                      {r.forced ? (
                        <span className="ml-1.5 text-destructive">(forced)</span>
                      ) : null}
                    </div>
                    <div>
                      {r.performedByFullName ?? r.performedByUsername ?? 'Admin'} —{' '}
                      {formatResetSummary(r)}
                      {r.notes ? ` · ${r.notes}` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No session resets recorded yet.</p>
          )}
        </CardContent>
      </Card>

      <SessionResetDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
