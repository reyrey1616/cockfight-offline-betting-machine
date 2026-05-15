// AppLayout — the chrome that wraps every authenticated route.
//
// Admins: top bar + left SideNav + scrollable main.
// Tellers: top bar is `TellerChromeHeader` (brand, desk nav, identity, sign-out).
import { Outlet, useNavigate } from 'react-router-dom'

import { SideNav } from '@/components/SideNav'
import { TellerChromeHeader } from '@/components/TellerChromeHeader'
import { Button } from '@/components/ui/button'
import { BRANDING, USER_ROLE_LABEL } from '@/constants'
import { useLogout } from '@/hooks/useAuth'
import { useAuthUser } from '@/store/auth'

export function AppLayout() {
  const user = useAuthUser()
  const navigate = useNavigate()
  const { mutate: doLogout, isPending } = useLogout()
  const isTeller = user?.role === 'TELLER'

  function handleLogout() {
    doLogout(undefined, {
      onSettled: () => {
        navigate('/login', { replace: true })
      }
    })
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      {isTeller ? (
        <TellerChromeHeader />
      ) : (
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-background px-4 py-2.5 sm:px-6 sm:py-3">
          <span className="shrink-0 text-base font-semibold tracking-tight">{BRANDING.APP_NAME}</span>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
      )}
      <div className="flex min-h-0 flex-1">
        {isTeller ? null : (
          <div className="shrink-0">
            <SideNav />
          </div>
        )}
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-muted/20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
