import { NavLink } from 'react-router-dom'

import { TELLER_APP_NAV } from '@/lib/app-nav'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/store/auth'

function linkClass(
  isActive: boolean,
  surface: 'default' | 'dark' = 'default'
) {
  const isDark = surface === 'dark'
  return cn(
    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? isDark
        ? 'bg-lime-400 text-zinc-950 shadow-sm'
        : 'bg-primary text-primary-foreground shadow-sm'
      : isDark
        ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  )
}

/** Desk nav links — rendered inside `TellerChromeHeader`. */
export function TellerAppNavLinks({
  className,
  surface = 'default',
  'aria-label': ariaLabel = 'Desk'
}: {
  className?: string
  surface?: 'default' | 'dark'
  'aria-label'?: string
}) {
  const user = useAuthUser()
  const items = TELLER_APP_NAV.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  return (
    <nav className={cn('flex flex-wrap items-center gap-1', className)} aria-label={ariaLabel}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => linkClass(isActive, surface)}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
