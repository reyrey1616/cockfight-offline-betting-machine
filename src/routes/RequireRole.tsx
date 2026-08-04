import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import {
  defaultPathForUser,
  isSuperAdminUser,
  roleDefaultPath
} from '@/lib/post-login-redirect'
import { useAuthUser } from '@/store/auth'
import type { UserRole } from '@/types/api'

interface RequireRoleProps {
  allow: UserRole[]
  children: ReactNode
  /** Overrides the automatic home route for unauthorized roles. */
  fallbackTo?: string
  /** Only these usernames may enter (used for super_admin-only hidden tools). */
  allowUsernames?: string[]
}

export function RequireRole({
  allow,
  children,
  fallbackTo,
  allowUsernames = []
}: RequireRoleProps) {
  const user = useAuthUser()
  if (!user) {
    return null
  }

  const usernameAllowed = allowUsernames.includes(user.username)
  const roleAllowed = allow.includes(user.role)

  if (!usernameAllowed && !roleAllowed) {
    const to =
      fallbackTo ??
      (isSuperAdminUser(user) ? defaultPathForUser(user) : roleDefaultPath(user.role))
    return <Navigate to={to} replace />
  }

  return <>{children}</>
}
