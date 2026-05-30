import { afterEach, describe, expect, it, vi } from 'vitest'

describe('resolveApiBaseUrl', () => {
  afterEach(() => {
    delete window.kioskConfig
    vi.unstubAllEnvs()
  })

  it('uses kiosk config apiBaseUrl over Vite env', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000')
    window.kioskConfig = { apiBaseUrl: 'http://192.168.1.6:8000' }
    const { resolveApiBaseUrl } = await import('@/lib/api-base-url')
    expect(resolveApiBaseUrl()).toBe('http://192.168.1.6:8000')
  })
})
