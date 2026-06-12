import { Navigate, Outlet } from 'react-router-dom'

import { roleDefaultPath } from '@/lib/post-login-redirect'
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
  if (!allow.includes(user.role)) {
    return <Navigate to={roleDefaultPath(user.role)} replace />
  }
  return <Outlet />
}
