import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { Collector } from '@/types/api'

export interface CollectorsTableProps {
  collectors: Collector[]
  listLoading: boolean
  isError: boolean
  listMessage: string | undefined
  onRefresh: () => void
  deletePending: boolean
  onEdit: (collector: Collector) => void
  onDeleteClick: (collector: Collector) => void
  onOpenBarcodePrint: (collector: Collector) => void
}

export function CollectorsTable({
  collectors,
  listLoading,
  isError,
  listMessage,
  onRefresh,
  deletePending,
  onEdit,
  onDeleteClick,
  onOpenBarcodePrint
}: CollectorsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle>Collectors</CardTitle>
          <CardDescription className="mt-1.5">
            Only active badges appear here. Delete removes a row from this list; use the
            barcode button to preview before printing.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void onRefresh()}
          disabled={listLoading}
        >
          {listLoading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load collectors</AlertTitle>
            <AlertDescription>{listMessage ?? 'Something went wrong.'}</AlertDescription>
          </Alert>
        ) : listLoading ? (
          <p className="text-sm text-muted-foreground">Loading collectors…</p>
        ) : collectors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No collectors yet. Add the first one using the form.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-lg text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collectors.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium text-foreground">{c.name}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{c.code}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenBarcodePrint(c)}
                        >
                          Barcode
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => onEdit(c)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={deletePending}
                          onClick={() => onDeleteClick(c)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
