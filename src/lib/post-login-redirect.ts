import type { UserRole } from '@/types/api'

/** Role landing page after sign-in. */
export function roleDefaultPath(role: UserRole): string {
  return role === 'ADMIN' ? '/dashboard' : '/kiosk'
}

function pathOnly(from: string): string {
  const q = from.indexOf('?')
  return q === -1 ? from : from.slice(0, q)
}

/** Whether a signed-in user may open this path (prefix rules mirror route guards). */
export function isPathAllowedForRole(from: string, role: UserRole): boolean {
  const path = pathOnly(from)
  if (!path || path === '/login') return false

  if (role === 'TELLER') {
    if (path === '/kiosk' || path.startsWith('/kiosk/')) return true
    if (path === '/display' || path.startsWith('/display/')) return true
    if (path === '/payout-machine' || path.startsWith('/payout-machine/')) return true
    if (path === '/home' || path.startsWith('/home/')) return true
    return false
  }

  // Admin — all app routes except teller-only kiosk.
  if (path === '/kiosk' || path.startsWith('/kiosk/')) return false
  return true
}

/**
 * After sign-in, honor `from` only when the new role may access that URL;
 * otherwise use the role default (`/dashboard` admin, `/kiosk` teller).
 */
export function resolvePostLoginPath(role: UserRole, from?: string | null): string {
  const defaultPath = roleDefaultPath(role)
  if (!from || from === '/login') return defaultPath
  return isPathAllowedForRole(from, role) ? from : defaultPath
}
