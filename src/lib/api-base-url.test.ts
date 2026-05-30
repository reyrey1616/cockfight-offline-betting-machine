import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  API_BASE_URL_STORAGE_KEY,
  getDefaultApiBaseUrlForLogin,
  normalizeApiBaseUrlInput,
  resolveApiBaseUrl,
  setStoredApiBaseUrl
} from '@/lib/api-base-url'

describe('api-base-url', () => {
  afterEach(() => {
    delete window.kioskConfig
    window.localStorage.clear()
    vi.unstubAllEnvs()
  })

  it('normalizes URLs without scheme and strips path', () => {
    expect(normalizeApiBaseUrlInput('192.168.1.6:8000')).toBe('http://192.168.1.6:8000')
    expect(normalizeApiBaseUrlInput('http://192.168.1.6:8000/')).toBe('http://192.168.1.6:8000')
  })

  it('uses localStorage override over kiosk config', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000')
    window.kioskConfig = { apiBaseUrl: 'http://192.168.1.6:8000' }
    setStoredApiBaseUrl('http://10.0.0.5:8000')
    expect(resolveApiBaseUrl()).toBe('http://10.0.0.5:8000')
  })

  it('uses kiosk config when no stored override', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000')
    window.kioskConfig = { apiBaseUrl: 'http://192.168.1.6:8000' }
    expect(resolveApiBaseUrl()).toBe('http://192.168.1.6:8000')
  })

  it('prefills login from stored URL', () => {
    window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, 'http://192.168.1.99:8000')
    expect(getDefaultApiBaseUrlForLogin()).toBe('http://192.168.1.99:8000')
  })
})
