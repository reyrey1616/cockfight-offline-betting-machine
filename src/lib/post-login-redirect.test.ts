import { describe, expect, it } from 'vitest'

import {
  defaultPathForUser,
  isPathAllowedForRole,
  isPathAllowedForUser,
  isSuperAdminUser,
  resolvePostLoginPath,
  roleDefaultPath,
  SUPER_ADMIN_USERNAME
} from '@/lib/post-login-redirect'

describe('post-login-redirect', () => {
  it('uses role defaults', () => {
    expect(roleDefaultPath('ADMIN')).toBe('/dashboard')
    expect(roleDefaultPath('TELLER')).toBe('/kiosk')
  })

  it('blocks teller from admin paths', () => {
    expect(isPathAllowedForRole('/admin/collectors', 'TELLER')).toBe(false)
    expect(isPathAllowedForRole('/dashboard', 'TELLER')).toBe(false)
    expect(
      resolvePostLoginPath({ username: 't1', role: 'TELLER' }, '/admin/collectors')
    ).toBe('/kiosk')
  })

  it('allows teller desk routes from saved redirect', () => {
    expect(isPathAllowedForRole('/payout-machine', 'TELLER')).toBe(true)
    expect(isPathAllowedForRole('/my-teller', 'TELLER')).toBe(false)
    expect(
      resolvePostLoginPath({ username: 't1', role: 'TELLER' }, '/payout-machine')
    ).toBe('/payout-machine')
  })

  it('blocks admin from teller-only kiosk and super-admin tools', () => {
    expect(isPathAllowedForRole('/kiosk', 'ADMIN')).toBe(false)
    expect(isPathAllowedForUser('/config', { username: 'admin', role: 'ADMIN' })).toBe(
      false
    )
    expect(isPathAllowedForUser('/bets', { username: 'admin', role: 'ADMIN' })).toBe(false)
    expect(
      resolvePostLoginPath({ username: 'admin', role: 'ADMIN' }, '/kiosk')
    ).toBe('/dashboard')
    expect(
      resolvePostLoginPath({ username: 'admin', role: 'ADMIN' }, '/config')
    ).toBe('/dashboard')
  })

  it('allows admin back to admin routes', () => {
    expect(
      resolvePostLoginPath({ username: 'admin', role: 'ADMIN' }, '/admin/collectors')
    ).toBe('/admin/collectors')
  })

  it('locks super_admin to hidden tool routes only (default /config)', () => {
    const user = { username: SUPER_ADMIN_USERNAME, role: 'ADMIN' as const }
    expect(isSuperAdminUser(user)).toBe(true)
    expect(defaultPathForUser(user)).toBe('/config')
    expect(isPathAllowedForUser('/config', user)).toBe(true)
    expect(isPathAllowedForUser('/bets', user)).toBe(true)
    expect(isPathAllowedForUser('/my-teller', user)).toBe(true)
    expect(isPathAllowedForUser('/dashboard', user)).toBe(false)
    expect(isPathAllowedForUser('/admin/tellers', user)).toBe(false)
    expect(isPathAllowedForUser('/kiosk', user)).toBe(false)
    expect(resolvePostLoginPath(user, '/dashboard')).toBe('/config')
    expect(resolvePostLoginPath(user, '/bets')).toBe('/bets')
    expect(resolvePostLoginPath(user)).toBe('/config')
  })
})
