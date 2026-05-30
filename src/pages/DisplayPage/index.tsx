import { useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { AppLogo } from '@/components/AppLogo'
import { SideNav } from '@/components/SideNav'
import { TellerChromeHeader } from '@/components/TellerChromeHeader'
import { Button } from '@/components/ui/button'
import { USER_ROLE_LABEL } from '@/constants'
import { useLogout } from '@/hooks/useAuth'
import { FightBoardPage } from '@/pages/FightBoardPage'
import { useAuthUser } from '@/store/auth'

/**
 * Arena / TV live board at `/display`.
 * Starts fullscreen (no nav). Minimize reveals normal app chrome for the signed-in role.
 */
export function DisplayPage() {
  const [minimized, setMinimized] = useState(false)
  const user = useAuthUser()
  const isTeller = user?.role === 'TELLER'
  const navigate = useNavigate()
  const { mutate: doLogout, isPending } = useLogout()

  function handleLogout() {
    doLogout(undefined, {
      onSettled: () => navigate('/login', { replace: true })
    })
  }

  if (!minimized) {
    return (
      <div className="relative min-h-dvh bg-black">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="fixed top-2 right-2 z-[60] h-8 w-8 border-zinc-600 bg-zinc-800/90 text-zinc-100 shadow-lg hover:bg-zinc-700"
          onClick={() => setMinimized(true)}
          aria-label="Minimize and show navigation"
        >
          <Minimize2 className="size-4" aria-hidden />
        </Button>
        <FightBoardPage mode="display" layout="fullscreen" />
      </div>
    )
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      {isTeller ? (
        <TellerChromeHeader
          subtitle="Live board"
          trailing={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setMinimized(false)}
            >
              <Maximize2 className="size-4" aria-hidden />
              Fullscreen
            </Button>
          }
        />
      ) : (
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-background px-4 py-2.5 sm:px-6 sm:py-3">
          <AppLogo />
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setMinimized(false)}
            >
              <Maximize2 className="size-4" aria-hidden />
              Fullscreen
            </Button>
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
          <FightBoardPage mode="display" layout="embedded" />
        </main>
      </div>
    </div>
  )
}
