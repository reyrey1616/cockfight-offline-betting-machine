// Login page.
//
// Single shadcn Card containing username + password. On submit calls
// the /auth/login mutation; on success the auth store gets populated
// and we Navigate to a role-safe post-login URL: honor `from` only when that
// role may access it; otherwise `/dashboard` (admin) or `/kiosk` (teller).
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
import {
  getDefaultApiBaseUrlForLogin,
  normalizeApiBaseUrlInput,
  setStoredApiBaseUrl
} from '@/lib/api-base-url'
import { resolvePostLoginPath } from '@/lib/post-login-redirect'
import { useAuthUser, useIsAuthenticated } from '@/store/auth'

interface LocationState {
  from?: string
}

export function LoginPage() {
  const isAuthed = useIsAuthenticated()
  const user = useAuthUser()
  const location = useLocation()
  const fromState = (location.state as LocationState | null) ?? null
  const postLoginPath =
    user != null ? resolvePostLoginPath(user.role, fromState?.from) : '/login'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [apiBaseUrl, setApiBaseUrl] = useState(() => getDefaultApiBaseUrlForLogin())
  const [serverUrlError, setServerUrlError] = useState<string | null>(null)
  const { mutate, isPending, error } = useLogin()

  if (isAuthed) {
    return <Navigate to={postLoginPath} replace />
  }

  function persistServerUrl(): boolean {
    const normalized = normalizeApiBaseUrlInput(apiBaseUrl)
    if (!normalized) {
      setServerUrlError('Enter a valid server URL, e.g. http://192.168.1.6:8000')
      return false
    }
    setStoredApiBaseUrl(apiBaseUrl)
    setApiBaseUrl(normalized)
    setServerUrlError(null)
    return true
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!persistServerUrl()) return
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
              <Label htmlFor="api-base-url">Server URL</Label>
              <Input
                id="api-base-url"
                name="apiBaseUrl"
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="http://192.168.1.6:8000"
                value={apiBaseUrl}
                onChange={(e) => {
                  setApiBaseUrl(e.target.value)
                  setServerUrlError(null)
                }}
                onBlur={() => {
                  if (apiBaseUrl.trim()) persistServerUrl()
                }}
                disabled={isPending}
              />
              <p className="text-[11px] leading-snug text-muted-foreground">
                LAN address of the betting server (not localhost on kiosk PCs). Saved on this
                device until you change it.
              </p>
              {serverUrlError ? (
                <p className="text-[11px] text-destructive">{serverUrlError}</p>
              ) : null}
            </div>

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
