import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import type { AdminUser } from '@/types/api'

export interface TellersTableProps {
  tellers: AdminUser[]
  listLoading: boolean
  isError: boolean
  listMessage: string | undefined
  onRefresh: () => void
  currentUserId: string | undefined
  patchPending: boolean
  onEdit: (user: AdminUser) => void
  onDeactivateClick: (user: AdminUser) => void
  onReactivate: (user: AdminUser) => void
}

export function TellersTable({
  tellers,
  listLoading,
  isError,
  listMessage,
  onRefresh,
  currentUserId,
  patchPending,
  onEdit,
  onDeactivateClick,
  onReactivate
}: TellersTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle>Tellers</CardTitle>
          <CardDescription className="mt-1.5">
            Edit names, passwords, or whether someone can sign in. Inactive tellers stay in
            the list for history.
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
            <AlertTitle>Could not load tellers</AlertTitle>
            <AlertDescription>{listMessage ?? 'Something went wrong.'}</AlertDescription>
          </Alert>
        ) : listLoading ? (
          <p className="text-sm text-muted-foreground">Loading tellers…</p>
        ) : tellers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tellers yet. Create the first account using the form.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-lg text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Username</th>
                  <th className="px-3 py-2 font-medium">Initials</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tellers.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium text-foreground">{u.fullName}</td>
                    <td className="px-3 py-2 text-muted-foreground">{u.username}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{u.initials}</td>
                    <td className="px-3 py-2">
                      {u.isActive ? (
                        <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(u)}
                        >
                          Edit
                        </Button>
                        {u.isActive && u.id !== currentUserId ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => onDeactivateClick(u)}
                          >
                            Turn off access
                          </Button>
                        ) : null}
                        {!u.isActive ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={patchPending}
                            onClick={() => onReactivate(u)}
                          >
                            Turn on access
                          </Button>
                        ) : null}
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
