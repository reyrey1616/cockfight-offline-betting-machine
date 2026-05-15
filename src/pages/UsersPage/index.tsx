// Admin > Tellers — add a new teller account (sign-in + bet-ticket initials).
//
// Client-side checks mirror `users.schemas.js` so tellers get fast feedback;
// the API remains the source of truth (policy denylist, uniqueness, etc.).

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
import { USER_ROLE_VALUE } from '@/constants'
import { useCreateUser, useTellersList, useUpdateUser } from '@/hooks/useUsers'
import { ApiError } from '@/lib/api'
import { useAuthUser } from '@/store/auth'
import type { AdminUser } from '@/types/api'

import { DeactivateTellerDialog } from './DeactivateTellerDialog'
import { EditTellerDialog } from './EditTellerDialog'
import { TellersTable } from './TellersTable'

/** Same as backend `usernamePattern`: first 3 alphabetic, then alnum or _. */
const USERNAME_REGEX = /^[A-Za-z]{3}[A-Za-z0-9_]{0,29}$/

function fieldErrors(input: {
  username: string
  password: string
  fullName: string
}): Partial<Record<'username' | 'password' | 'fullName', string>> {
  const out: Partial<Record<'username' | 'password' | 'fullName', string>> = {}
  const u = input.username.trim()
  if (!USERNAME_REGEX.test(u)) {
    out.username =
      '3–32 characters: first 3 must be letters (for bet-ticket initials); after that letters, digits, or underscore only.'
  }
  if (input.password.length < 8) out.password = 'At least 8 characters.'
  if (input.password.length > 256) out.password = 'At most 256 characters.'
  const fn = input.fullName.trim()
  if (fn.length < 1) out.fullName = 'Full name is required.'
  if (fn.length > 100) out.fullName = 'At most 100 characters.'
  return out
}

export function UsersPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<'username' | 'password' | 'fullName', string>>
  >({})

  const { data: tellersData, isPending: listLoading, isError, error: listError, refetch } =
    useTellersList()
  const { mutate, isPending, error } = useCreateUser()
  const me = useAuthUser()
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null)
  const { mutate: patchTeller, isPending: patchPending } = useUpdateUser()

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmedUser = username.trim()
    const trimmedName = fullName.trim()
    const errs = fieldErrors({
      username: trimmedUser,
      password,
      fullName: trimmedName
    })
    setClientErrors(errs)
    if (Object.keys(errs).length > 0) return

    mutate(
      {
        username: trimmedUser,
        password,
        fullName: trimmedName,
        role: USER_ROLE_VALUE.TELLER
      },
      {
        onSuccess: (data) => {
          setUsername('')
          setPassword('')
          setFullName('')
          setClientErrors({})
          toast.success(`“${data.user.username}” is ready`, {
            description: `They sign in as a teller. Ticket initials: ${data.user.initials}.`
          })
        }
      }
    )
  }

  const apiMessage =
    error instanceof ApiError ? error.message : error?.message

  const listMessage =
    listError instanceof ApiError ? listError.message : listError?.message

  const tellers = tellersData?.users ?? []

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tellers</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tellers sign in here to take bets. Edit a row to change their name, access, or
          password. Accounts are never permanently deleted — you can only turn access off
          for audit reasons.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-start">
        <TellersTable
          tellers={tellers}
          listLoading={listLoading}
          isError={isError}
          listMessage={listMessage}
          onRefresh={() => void refetch()}
          currentUserId={me?.id}
          patchPending={patchPending}
          onEdit={setEditing}
          onDeactivateClick={setDeactivateTarget}
          onReactivate={(u) => {
            patchTeller(
              { id: u.id, body: { isActive: true } },
              {
                onSuccess: () =>
                  toast.success(`“${u.username}” can sign in again.`)
              }
            )
          }}
        />

        <Card className="max-w-md lg:max-w-none">
          <CardHeader>
            <CardTitle>Create teller</CardTitle>
            <CardDescription>
              Add someone who can sign in at this kiosk and take bets. They are
              always added as a teller. Share the username and initial password
              with them so they can sign in and change their password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="create-username">Username</Label>
                <Input
                  id="create-username"
                  name="username"
                  autoComplete="off"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isPending}
                  placeholder="e.g. tel001"
                />
                {clientErrors.username ? (
                  <p className="text-sm text-destructive">{clientErrors.username}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    First three characters become the ticket initials (must be
                    letters).
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="create-fullname">Full name</Label>
                <Input
                  id="create-fullname"
                  name="fullName"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isPending}
                  placeholder="Display name on receipts"
                />
                {clientErrors.fullName ? (
                  <p className="text-sm text-destructive">{clientErrors.fullName}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="create-password">Initial password</Label>
                <Input
                  id="create-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  minLength={8}
                  maxLength={256}
                />
                {clientErrors.password ? (
                  <p className="text-sm text-destructive">{clientErrors.password}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    At least 8 characters. Very common passwords are not allowed.
                  </p>
                )}
              </div>

              {apiMessage ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not create teller</AlertTitle>
                  <AlertDescription>{apiMessage}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating…' : 'Create teller'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <EditTellerDialog
        user={editing}
        currentUserId={me?.id}
        onClose={() => setEditing(null)}
      />
      <DeactivateTellerDialog
        user={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        isConfirming={patchPending}
        onConfirm={() => {
          if (!deactivateTarget) return
          patchTeller(
            { id: deactivateTarget.id, body: { isActive: false } },
            {
              onSuccess: () => {
                toast.success(`Access is off for “${deactivateTarget.username}”.`)
                setDeactivateTarget(null)
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
