import type { PublicUser, UserRole } from '@/types/api'

/** Hardcoded IT login username (password is checked only on the API). */
export const SUPER_ADMIN_USERNAME = 'super_admin'

/** Landing + only allowed app routes for the super_admin login. */
export const SUPER_ADMIN_DEFAULT_PATH = '/config'

export const SUPER_ADMIN_ALLOWED_PATHS = [
  '/my-teller',
  '/config',
  '/bets'
] as const

export function isSuperAdminUser(
  user: Pick<PublicUser, 'username'> | null | undefined
): boolean {
  return user?.username === SUPER_ADMIN_USERNAME
}

function pathOnly(from: string): string {
  const q = from.indexOf('?')
  return q === -1 ? from : from.slice(0, q)
}

/** Super admin may only open the three hidden tool routes. */
export function isSuperAdminAllowedPath(from: string): boolean {
  const path = pathOnly(from)
  return SUPER_ADMIN_ALLOWED_PATHS.some(
    (allowed) => path === allowed || path.startsWith(`${allowed}/`)
  )
}

export function defaultPathForUser(
  user: Pick<PublicUser, 'username' | 'role'>
): string {
  if (isSuperAdminUser(user)) return SUPER_ADMIN_DEFAULT_PATH
  return user.role === 'ADMIN' ? '/dashboard' : '/kiosk'
}

/** Role landing page after sign-in (non–super-admin). */
export function roleDefaultPath(role: UserRole): string {
  return role === 'ADMIN' ? '/dashboard' : '/kiosk'
}

/** Whether a signed-in user may open this path (prefix rules mirror route guards). */
export function isPathAllowedForUser(
  from: string,
  user: Pick<PublicUser, 'username' | 'role'>
): boolean {
  const path = pathOnly(from)
  if (!path || path === '/login') return false

  // Hidden IT tools — super_admin only (manual URL; no nav links).
  if (isSuperAdminAllowedPath(path)) {
    return isSuperAdminUser(user)
  }

  if (isSuperAdminUser(user)) {
    return false
  }

  if (user.role === 'TELLER') {
    if (path === '/kiosk' || path.startsWith('/kiosk/')) return true
    if (path === '/display' || path.startsWith('/display/')) return true
    if (path === '/payout-machine' || path.startsWith('/payout-machine/')) return true
    if (path === '/home' || path.startsWith('/home/')) return true
    return false
  }

  // Admin — all app routes except teller-only kiosk and super-admin tools.
  if (path === '/kiosk' || path.startsWith('/kiosk/')) return false
  return true
}

/**
 * After sign-in, honor `from` only when the user may access that URL;
 * otherwise use their default landing path.
 */
export function resolvePostLoginPath(
  user: Pick<PublicUser, 'username' | 'role'>,
  from?: string | null
): string {
  const defaultPath = defaultPathForUser(user)
  if (!from || from === '/login') return defaultPath
  return isPathAllowedForUser(from, user) ? from : defaultPath
}

/** @deprecated Prefer `isPathAllowedForUser` — kept for role-only call sites. */
export function isPathAllowedForRole(from: string, role: UserRole): boolean {
  return isPathAllowedForUser(from, { username: '', role })
}
