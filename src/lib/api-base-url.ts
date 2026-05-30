/**
 * HTTP base URL for the machine client API (axios + WebSocket upgrade host).
 *
 * Multi-computer LAN: teller kiosks are separate PCs; they must call the **server**
 * machine’s IP (from Electron config.json), not localhost on the kiosk.
 *
 * Priority:
 *   1. Electron `config.json` → `apiBaseUrl` (same URL on every kiosk at a site)
 *   2. Vite env `VITE_API_BASE_URL` (build-time fallback)
 *   3. `auto` — browser dev only (same host as page, port 8000). Never used in Electron.
 */

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

export function resolveApiBaseUrl(): string {
  const kiosk = runtimeKioskApiBaseUrl()
  if (kiosk) return kiosk.replace(/\/$/, '')

  // Packaged app loads UI from 127.0.0.1 — "auto" would wrongly target this PC, not the server.
  if (isElectronKiosk()) {
    if (raw && raw.toLowerCase() !== 'auto') {
      return raw.replace(/\/$/, '')
    }
    console.error(
      '[Cockfight Kiosk] apiBaseUrl missing in config.json — set your server LAN IP, e.g. http://192.168.1.6:8000'
    )
    return `http://127.0.0.1:${apiPort}`
  }

  if (!raw || raw.toLowerCase() === 'auto') {
    return autoBaseFromBrowser()
  }
  return raw.replace(/\/$/, '')
}
