/**
 * HTTP base URL for the machine client API (axios + WebSocket upgrade host).
 *
 * Configure in `.env.development`, `.env.production`, or `.env.local` (gitignored):
 *
 *   VITE_API_BASE_URL=http://localhost:8000     — fixed URL
 *   VITE_API_BASE_URL=http://192.168.1.7:8000   — LAN IP (explicit)
 *   VITE_API_BASE_URL=auto                      — same host as the page, port from VITE_API_PORT
 *
 * `auto` is intended for `vite` with `server.host: true`: open the app as
 * http://<this-pc-lan-ip>:5173 on a phone → API becomes http://<that-ip>:8000.
 */

const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? ''
const portRaw = (import.meta.env.VITE_API_PORT as string | undefined)?.trim() ?? '8000'
const apiPort = portRaw || '8000'

function autoBaseFromBrowser(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname } = window.location
    return `${protocol}//${hostname}:${apiPort}`
  }
  return `http://localhost:${apiPort}`
}

export function resolveApiBaseUrl(): string {
  if (!raw || raw.toLowerCase() === 'auto') {
    return autoBaseFromBrowser()
  }
  return raw
}
