// ProtectedRoute — outlet guard. Renders children if authenticated;
// otherwise redirects to /login while preserving the originally
// requested URL in router state so we can bounce the user back after
// successful login. Also enforces role/username path allowlists so
// users cannot linger on forbidden URLs before a nested role gate runs.
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import {
  defaultPathForUser,
  isPathAllowedForUser
} from '@/lib/post-login-redirect'
import { useAuthUser, useIsAuthenticated } from '@/store/auth'

export function ProtectedRoute() {
  const isAuthed = useIsAuthenticated()
  const user = useAuthUser()
  const location = useLocation()
  const fullPath = location.pathname + location.search

  if (!isAuthed || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: fullPath }}
      />
    )
  }

  if (!isPathAllowedForUser(location.pathname, user)) {
    return <Navigate to={defaultPathForUser(user)} replace />
  }

  return <Outlet />
}
