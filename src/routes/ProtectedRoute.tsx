// ProtectedRoute — outlet guard. Renders children if authenticated;
// otherwise redirects to /login while preserving the originally
// requested URL in router state so we can bounce the user back after
// successful login.
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useIsAuthenticated } from '@/store/auth'

export function ProtectedRoute() {
  const isAuthed = useIsAuthenticated()
  const location = useLocation()

  if (!isAuthed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }
  return <Outlet />
}
