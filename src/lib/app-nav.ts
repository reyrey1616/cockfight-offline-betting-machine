import type { PublicUser, UserRole } from '@/types/api'

export interface AppNavItem {
  to: string
  label: string
  roles?: UserRole[]
}

/** Teller — horizontal links inside `TellerChromeHeader`. */
export const TELLER_APP_NAV: AppNavItem[] = [
  { to: '/display', label: 'Live board' },
  { to: '/payout-machine', label: 'Payout machine' },
  { to: '/kiosk', label: 'Betting kiosk', roles: ['TELLER'] }
]

/** Admin — vertical `SideNav`. */
export const ADMIN_APP_NAV: AppNavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/operate-fights', label: 'Operate fights' },
  { to: '/admin/tellers', label: 'Tellers', roles: ['ADMIN'] },
  { to: '/admin/collectors', label: 'Collectors', roles: ['ADMIN'] },
  { to: '/admin/settings', label: 'Settings', roles: ['ADMIN'] }
]

export function visibleAdminNav(user: PublicUser): AppNavItem[] {
  return ADMIN_APP_NAV.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  )
}
