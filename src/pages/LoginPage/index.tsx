// Login page.
//
// Single shadcn Card containing username + password. On submit calls
// the /auth/login mutation; on success the auth store gets populated
// and we Navigate back to the user's originally-requested URL (carried
// in location.state.from by ProtectedRoute), or a role default (`/dashboard`
// for admin, `/kiosk` for teller) when they open /login directly.
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { AppLogo } from '@/components/AppLogo'
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
import { BRANDING } from '@/constants'
import { useLogin } from '@/hooks/useAuth'
import { useAuthUser, useIsAuthenticated } from '@/store/auth'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const isAuthed = useIsAuthenticated()
  const user = useAuthUser()
  const location = useLocation()
  const fromState = (location.state as LocationState | null) ?? null
  const roleDefault = user?.role === 'ADMIN' ? '/dashboard' : '/kiosk'
  const fallback =
    fromState?.from && fromState.from !== '/login' ? fromState.from : roleDefault

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { mutate, isPending, error } = useLogin()

  if (isAuthed) {
    return <Navigate to={fallback} replace />
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    mutate({ username: username.trim(), password })
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <AppLogo size="login" className="mx-auto object-center" />
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>{BRANDING.LOGIN_KIOSK_TAGLINE}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
