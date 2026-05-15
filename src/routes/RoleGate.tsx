// RoleGate — declarative role guard. Wrap inside <ProtectedRoute>
// to additionally restrict a sub-tree to specific roles:
//
//   <Route element={<RoleGate allow={['ADMIN']} />}>
//     <Route path="/admin/*" element={<AdminLayout />} />
//   </Route>
//
// Users without the role see a small "Forbidden" stub. We do not
// redirect away — the user is logged in, just not authorized; sending
// them to /login would be wrong and noisy.
import { Outlet } from 'react-router-dom'

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
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-2xl font-semibold">Forbidden</h1>
        <p className="text-sm text-muted-foreground">
          You don&apos;t have access to this page.
        </p>
      </div>
    )
  }
  return <Outlet />
}
