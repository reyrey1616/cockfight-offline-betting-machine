import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { TellerAppNavLinks } from '@/components/TellerAppNavLinks'
import { TellerCashActions } from '@/components/teller-cash/TellerCashActions'
import { TellerCashOnHand } from '@/components/teller-cash/TellerCashOnHand'
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
  /** `dark` for full-screen kiosk header on zinc background. */
  surface?: 'default' | 'dark'
  className?: string
}

/**
 * Persistent teller top bar ("chrome" = app shell around page content, not browser Chrome).
 * Used on `AppLayout` routes and `/kiosk`. Brand + desk nav left; cash, identity, sign-out right.
 */
export function TellerChromeHeader({
  subtitle,
  trailing,
  surface = 'default',
  className
}: TellerChromeHeaderProps) {
  const user = useAuthUser()
  const navigate = useNavigate()
  const { mutate: doLogout, isPending } = useLogout()

  const isDark = surface === 'dark'
  const darkOutlineBtn =
    'border-zinc-500 bg-white text-zinc-950 shadow-sm hover:bg-zinc-100 hover:text-zinc-950'

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
        isDark && 'border-zinc-800 bg-zinc-950',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <div className="min-w-0 shrink-0">
          <div
            className={cn(
              'text-base font-semibold tracking-tight',
              isDark && 'text-zinc-100'
            )}
          >
            {BRANDING.APP_NAME}
          </div>
          {subtitle ? <div className="mt-0.5">{subtitle}</div> : null}
        </div>
        <TellerAppNavLinks
          surface={surface}
          className={cn('border-l pl-3', isDark ? 'border-zinc-700' : 'border-border')}
          aria-label="Main"
        />
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
        {trailing}
        {user?.role === 'TELLER' ? (
          <>
            <TellerCashOnHand surface={surface} />
            <TellerCashActions surface={surface} />
          </>
        ) : null}
        {user ? (
          <div className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                'hidden max-w-40 truncate font-medium sm:inline',
                isDark ? 'text-zinc-200' : 'text-foreground'
              )}
            >
              {user.fullName}
            </span>
            <span
              className={cn(
                'rounded-md border px-2 py-0.5 text-xs font-medium uppercase',
                isDark
                  ? 'border-zinc-600 bg-zinc-900 text-zinc-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {USER_ROLE_LABEL[user.role]}
            </span>
          </div>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className={isDark ? darkOutlineBtn : undefined}
          onClick={handleLogout}
          disabled={isPending}
        >
          {isPending ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </header>
  )
}
