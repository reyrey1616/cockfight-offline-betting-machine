import { Navigate, Outlet } from 'react-router-dom'

import {
  defaultPathForUser,
  isSuperAdminUser,
  roleDefaultPath
} from '@/lib/post-login-redirect'
import { useAuthUser } from '@/store/auth'
import type { UserRole } from '@/types/api'

interface RoleGateProps {
  allow: UserRole[]
}

export function RoleGate({ allow }: RoleGateProps) {
  const user = useAuthUser()
  if (!user) {
    return null
  }
  // Super admin is ADMIN in JWT but must not enter full admin sections.
  if (isSuperAdminUser(user) || !allow.includes(user.role)) {
    return (
      <Navigate
        to={isSuperAdminUser(user) ? defaultPathForUser(user) : roleDefaultPath(user.role)}
        replace
      />
    )
  }
  return <Outlet />
}
