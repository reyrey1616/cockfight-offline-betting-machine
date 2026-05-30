/**
 * HTTP base URL for the machine client API (axios + WebSocket upgrade host).
 *
 * Multi-computer LAN: teller kiosks are separate PCs; they must call the **server**
 * machine’s IP (from login override, Electron config.json, or build env).
 *
 * Priority:
 *   1. Login page / localStorage override (`fmj_api_base_url`)
 *   2. Electron `config.json` → `apiBaseUrl` (installer default)
 *   3. Vite env `VITE_API_BASE_URL` (build-time fallback)
 *   4. `auto` — browser dev only (same host as page, port 8000). Never used in Electron.
 */

export const API_BASE_URL_STORAGE_KEY = 'fmj_api_base_url'

const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? ''
const portRaw = (import.meta.env.VITE_API_PORT as string | undefined)?.trim() ?? '8000'
const apiPort = portRaw || '8000'

function isElectronKiosk(): boolean {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true
}

function runtimeKioskApiBaseUrl(): string | null {
  if (typeof window === 'undefined') return null
  const url = window.kioskConfig?.apiBaseUrl?.trim()
  return url || null
}

function autoBaseFromBrowser(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname } = window.location
    return `${protocol}//${hostname}:${apiPort}`
  }
  return `http://localhost:${apiPort}`
}

/** Normalize user input: trim, strip trailing slash, default http if scheme missing. */
export function normalizeApiBaseUrlInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`
  try {
    const u = new URL(withScheme)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return `${u.protocol}//${u.host}`
  } catch {
    return null
  }
}

export function getStoredApiBaseUrl(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const rawStored = window.localStorage.getItem(API_BASE_URL_STORAGE_KEY)?.trim()
    if (!rawStored) return null
    return normalizeApiBaseUrlInput(rawStored)
  } catch {
    return null
  }
}

export function setStoredApiBaseUrl(url: string): boolean {
  const normalized = normalizeApiBaseUrlInput(url)
  if (!normalized) return false
  try {
    window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalized)
    return true
  } catch {
    return false
  }
}

export function clearStoredApiBaseUrl(): void {
  try {
    window.localStorage.removeItem(API_BASE_URL_STORAGE_KEY)
  } catch {
    // ignore quota / private mode
  }
}

/** Effective URL for display on login (stored → kiosk file → env → auto). */
export function getDefaultApiBaseUrlForLogin(): string {
  const stored = getStoredApiBaseUrl()
  if (stored) return stored

  const kiosk = runtimeKioskApiBaseUrl()
  if (kiosk) return kiosk.replace(/\/$/, '')

  if (isElectronKiosk()) {
    if (raw && raw.toLowerCase() !== 'auto') {
      return raw.replace(/\/$/, '')
    }
    return ''
  }

  if (!raw || raw.toLowerCase() === 'auto') {
    return autoBaseFromBrowser()
  }
  return raw.replace(/\/$/, '')
}

export function resolveApiBaseUrl(): string {
  const stored = getStoredApiBaseUrl()
  if (stored) return stored

  const kiosk = runtimeKioskApiBaseUrl()
  if (kiosk) return kiosk.replace(/\/$/, '')

  // Packaged app loads UI from 127.0.0.1 — "auto" would wrongly target this PC, not the server.
  if (isElectronKiosk()) {
    if (raw && raw.toLowerCase() !== 'auto') {
      return raw.replace(/\/$/, '')
    }
    console.error(
      '[FMJ Kiosk] apiBaseUrl missing — set server URL on the login page or in config.json, e.g. http://192.168.1.6:8000'
    )
    return `http://127.0.0.1:${apiPort}`
  }

  if (!raw || raw.toLowerCase() === 'auto') {
    return autoBaseFromBrowser()
  }
  return raw.replace(/\/$/, '')
}
