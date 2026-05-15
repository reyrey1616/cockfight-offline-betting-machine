import { describe, expect, it } from 'vitest'

import { ADMIN_APP_NAV, TELLER_APP_NAV, visibleAdminNav } from '@/lib/app-nav'
import { adminUser, tellerUser } from '@/test/fixtures'

describe('app-nav', () => {
  it('exposes admin routes including dashboard and settings', () => {
    const labels = ADMIN_APP_NAV.map((i) => i.label)
    expect(labels).toContain('Dashboard')
    expect(labels).toContain('Operate fights')
    expect(labels).toContain('Settings')
    expect(ADMIN_APP_NAV.find((i) => i.to === '/operate-fights')).toBeDefined()
  })

  it('filters admin-only items for teller role', () => {
    const visible = visibleAdminNav(tellerUser)
    const labels = visible.map((i) => i.label)
    expect(labels).not.toContain('Tellers')
    expect(labels).not.toContain('Settings')
    expect(labels).toContain('Dashboard')
  })

  it('shows full admin nav for admin role', () => {
    const visible = visibleAdminNav(adminUser)
    expect(visible.length).toBe(ADMIN_APP_NAV.length)
  })

  it('scopes teller kiosk link to teller role', () => {
    const kiosk = TELLER_APP_NAV.find((i) => i.to === '/kiosk')
    expect(kiosk?.roles).toEqual(['TELLER'])
  })
})
