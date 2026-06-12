import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { roleDefaultPath } from '@/lib/post-login-redirect'
import { useAuthUser } from '@/store/auth'
import type { UserRole } from '@/types/api'

interface RequireRoleProps {
  allow: UserRole[]
  children: ReactNode
  /** Overrides the automatic home route for unauthorized roles. */
  fallbackTo?: string
}

export function RequireRole({ allow, children, fallbackTo }: RequireRoleProps) {
  const user = useAuthUser()
  if (!user) {
    return null
  }
  if (!allow.includes(user.role)) {
    const to = fallbackTo ?? roleDefaultPath(user.role)
    return <Navigate to={to} replace />
  }
  return <>{children}</>
}
