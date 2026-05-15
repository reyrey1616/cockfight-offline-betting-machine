// Left-side navigation for the app (admin layout only).
//
// Tellers use `TellerChromeHeader` in `AppLayout` / `TellerLiveBoardPage` — see those files.
import { NavLink } from 'react-router-dom'

import { visibleAdminNav } from '@/lib/app-nav'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/store/auth'

export function SideNav() {
  const user = useAuthUser()
  const visible = user ? visibleAdminNav(user) : []

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r bg-background p-3">
      {visible.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
