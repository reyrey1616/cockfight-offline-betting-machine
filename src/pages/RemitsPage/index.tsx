import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/lib/api'
import { deleteCashRemit, listLedger } from '@/lib/api-cash'
import { DASHBOARD_QUERY_PREFIX } from '@/lib/dashboard-query-keys'
import { formatMoney } from '@/lib/format-money'
import { useTellersList } from '@/hooks/useUsers'
import type { LedgerEntryRow } from '@/types/api'

const LIST_LIMIT = 500
/** API max page size for `GET /cash/ledger`. */
const PAGE_SIZE = 200

/** REMIT ledger rows, newest first, up to {@link LIST_LIMIT}. */
async function fetchRemits(tellerId: string): Promise<LedgerEntryRow[]> {
  const out: LedgerEntryRow[] = []
  let cursor: string | undefined
  do {
    const page = await listLedger({
      tellerId: tellerId || undefined,
      type: 'REMIT',
      limit: PAGE_SIZE,
      cursor
    })
    for (const e of page.entries) {
      out.push(e)
      if (out.length >= LIST_LIMIT) return out
    }
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  return out
}

function remitAmount(amount: string): string {
  const n = Math.abs(Number(amount))
  return Number.isFinite(n) ? formatMoney(n.toFixed(2)) : '—'
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * Hidden admin tool at `/remits1` (not in navbar).
 * Deletes teller remittances to collectors; teller cash on hand is left unchanged.
 */
export function RemitsPage() {
  const queryClient = useQueryClient()
  const tellersQuery = useTellersList()
  const [tellerId, setTellerId] = useState<string>('')
  const [pendingRemit, setPendingRemit] = useState<LedgerEntryRow | null>(null)

  const remitsQuery = useQuery({
    queryKey: ['admin-remits-delete', tellerId || 'ALL'],
    queryFn: () => fetchRemits(tellerId)
  })

  const remits = remitsQuery.data ?? []

  const tellerName = (id: string) => {
    const t = tellersQuery.data?.users?.find((u) => u.id === id)
    return t?.fullName ?? id
  }

  const deleteMutation = useMutation({
    mutationFn: (remitId: string) => deleteCashRemit(remitId),
    onSuccess: (res) => {
      setPendingRemit(null)
      toast.success(
        `Deleted remit ${remitAmount(res.deleted.amount)} from ${tellerName(res.deleted.tellerId)}`
      )
      void queryClient.invalidateQueries({ queryKey: ['admin-remits-delete'] })
      void queryClient.invalidateQueries({ queryKey: [...DASHBOARD_QUERY_PREFIX] })
    },
    onError: (e) => {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Delete failed.'
      toast.error(msg)
    }
  })

  return (
    <div className="space-y-4 p-4 pb-10">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Showing up to {LIST_LIMIT} most recent remittances.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Teller</span>
            <select
              className="h-9 min-w-[14rem] rounded-md border bg-background px-2 text-sm"
              value={tellerId}
              onChange={(e) => setTellerId(e.target.value)}
            >
              <option value="">All tellers</option>
              {(tellersQuery.data?.users ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.username})
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={remitsQuery.isFetching}
            onClick={() => void remitsQuery.refetch()}
          >
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Remittances</CardTitle>
          <CardDescription>
            {remitsQuery.isLoading
              ? 'Loading…'
              : remitsQuery.isError
                ? 'Could not load remittances.'
                : `${remits.length} row(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[min(70dvh,40rem)] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-card text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr className="border-b">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Teller</th>
                  <th className="px-3 py-2">Collector</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Notes</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {remits.length === 0 && !remitsQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      No remittances in this scope.
                    </td>
                  </tr>
                ) : null}
                {remits.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="px-3 py-2 whitespace-nowrap">{formatWhen(r.createdAt)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.code ?? '—'}</td>
                    <td className="px-3 py-2">{tellerName(r.tellerId)}</td>
                    <td className="px-3 py-2">{r.collectorName?.trim() || '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{remitAmount(r.amount)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.notes?.trim() || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => setPendingRemit(r)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pendingRemit ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remit-delete-confirm-title"
        >
          <div className="w-full max-w-md rounded-lg border bg-background p-4 shadow-lg">
            <h2 id="remit-delete-confirm-title" className="text-lg font-semibold">
              Delete remittance {pendingRemit.code ?? ''}?
            </h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="text-foreground">{tellerName(pendingRemit.tellerId)}</span> →{' '}
                <span className="text-foreground">
                  {pendingRemit.collectorName?.trim() || 'collector'}
                </span>{' '}
                · {remitAmount(pendingRemit.amount)} · {formatWhen(pendingRemit.createdAt)}
              </p>
              <p>The record is removed permanently. Teller cash on hand will not change.</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={deleteMutation.isPending}
                onClick={() => setPendingRemit(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(pendingRemit.id)}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete permanently'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
