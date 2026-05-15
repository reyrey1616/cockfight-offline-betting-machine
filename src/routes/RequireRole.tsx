import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthUser } from '@/store/auth'
import type { PublicUser, UserRole } from '@/types/api'

interface RequireRoleProps {
  allow: UserRole[]
  children: ReactNode
  /** Overrides the automatic home route for unauthorized roles. */
  fallbackTo?: string
}

function defaultRoleHome(user: PublicUser): string {
  return user.role === 'ADMIN' ? '/dashboard' : '/kiosk'
}

export function RequireRole({ allow, children, fallbackTo }: RequireRoleProps) {
  const user = useAuthUser()
  if (!user) {
    return null
  }
  if (!allow.includes(user.role)) {
    const to = fallbackTo ?? defaultRoleHome(user)
    return <Navigate to={to} replace />
  }
  return <>{children}</>
}
