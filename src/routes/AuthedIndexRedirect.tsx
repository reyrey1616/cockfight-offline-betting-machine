import { Navigate } from 'react-router-dom'

import { useAuthUser } from '@/store/auth'

/** `/` inside the app — role-aware landing after login. */
export function AuthedIndexRedirect() {
  const user = useAuthUser()
  if (!user) {
    return null
  }
  const to = user.role === 'ADMIN' ? '/dashboard' : '/kiosk'
  return <Navigate to={to} replace />
}
