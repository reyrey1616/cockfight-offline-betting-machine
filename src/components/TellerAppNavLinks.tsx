import { NavLink } from 'react-router-dom'

import { TELLER_APP_NAV } from '@/lib/app-nav'
import { cn } from '@/lib/utils'
import { useAuthUser } from '@/store/auth'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  )

/** Desk nav links — rendered inside `TellerChromeHeader`. */
export function TellerAppNavLinks({
  className,
  'aria-label': ariaLabel = 'Desk'
}: {
  className?: string
  'aria-label'?: string
}) {
  const user = useAuthUser()
  const items = TELLER_APP_NAV.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  return (
    <nav className={cn('flex flex-wrap items-center gap-1', className)} aria-label={ariaLabel}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={linkClass}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
