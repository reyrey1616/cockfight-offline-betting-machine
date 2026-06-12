import { describe, expect, it } from 'vitest'

import {
  isPathAllowedForRole,
  resolvePostLoginPath,
  roleDefaultPath
} from '@/lib/post-login-redirect'

describe('post-login-redirect', () => {
  it('uses role defaults', () => {
    expect(roleDefaultPath('ADMIN')).toBe('/dashboard')
    expect(roleDefaultPath('TELLER')).toBe('/kiosk')
  })

  it('blocks teller from admin paths', () => {
    expect(isPathAllowedForRole('/admin/collectors', 'TELLER')).toBe(false)
    expect(isPathAllowedForRole('/dashboard', 'TELLER')).toBe(false)
    expect(resolvePostLoginPath('TELLER', '/admin/collectors')).toBe('/kiosk')
  })

  it('allows teller desk routes from saved redirect', () => {
    expect(isPathAllowedForRole('/payout-machine', 'TELLER')).toBe(true)
    expect(resolvePostLoginPath('TELLER', '/payout-machine')).toBe('/payout-machine')
  })

  it('blocks admin from teller-only kiosk', () => {
    expect(isPathAllowedForRole('/kiosk', 'ADMIN')).toBe(false)
    expect(resolvePostLoginPath('ADMIN', '/kiosk')).toBe('/dashboard')
  })

  it('allows admin back to admin routes', () => {
    expect(resolvePostLoginPath('ADMIN', '/admin/collectors')).toBe('/admin/collectors')
  })
})
