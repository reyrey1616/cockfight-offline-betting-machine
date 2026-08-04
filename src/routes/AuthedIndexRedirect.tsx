import { Navigate } from 'react-router-dom'

import { defaultPathForUser } from '@/lib/post-login-redirect'
import { useAuthUser } from '@/store/auth'

/** `/` inside the app — role-aware landing after login. */
export function AuthedIndexRedirect() {
  const user = useAuthUser()
  if (!user) {
    return null
  }
  return <Navigate to={defaultPathForUser(user)} replace />
}
