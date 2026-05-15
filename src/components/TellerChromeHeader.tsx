import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { TellerAppNavLinks } from '@/components/TellerAppNavLinks'
import { Button } from '@/components/ui/button'
import { BRANDING, USER_ROLE_LABEL } from '@/constants'
import { useLogout } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/store/auth'

export interface TellerChromeHeaderProps {
  /** Second line under the app name (e.g. kiosk context). */
  subtitle?: ReactNode
  /** Shown before the user block on the right (e.g. live connection status). */
  trailing?: ReactNode
  className?: string
}

/**
 * Single top bar for all teller surfaces (`AppLayout` routes and `/kiosk`).
 * Brand + desk nav on the left; optional trailing slot, identity, sign-out on the right.
 */
export function TellerChromeHeader({ subtitle, trailing, className }: TellerChromeHeaderProps) {
  const user = useAuthUser()
  const navigate = useNavigate()
  const { mutate: doLogout, isPending } = useLogout()

  function handleLogout() {
    doLogout(undefined, {
      onSettled: () => {
        navigate('/login', { replace: true })
      }
    })
  }

  return (
    <header
      className={cn(
        'flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-background px-4 py-2.5 sm:px-6 sm:py-3',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <div className="min-w-0 shrink-0">
          <div className="text-base font-semibold tracking-tight">{BRANDING.APP_NAME}</div>
          {subtitle ? <div className="mt-0.5">{subtitle}</div> : null}
        </div>
        <TellerAppNavLinks className="border-l border-border pl-3" aria-label="Main" />
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
        {trailing}
        {user ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden max-w-40 truncate font-medium text-foreground sm:inline">
              {user.fullName}
            </span>
            <span className="rounded-md border bg-muted px-2 py-0.5 text-xs font-medium uppercase text-muted-foreground">
              {USER_ROLE_LABEL[user.role]}
            </span>
          </div>
        ) : null}
        <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
          {isPending ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </header>
  )
}
