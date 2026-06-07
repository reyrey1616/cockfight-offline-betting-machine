export const COLLECTOR_CODE_MAX = 8
export const COLLECTOR_CODE_PREFIX = 'COL'

export function sanitizeCollectorCodeInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, COLLECTOR_CODE_MAX)
}

export function isCompleteCollectorCode(code: string): boolean {
  const normalized = sanitizeCollectorCodeInput(code)
  return (
    normalized.length === COLLECTOR_CODE_MAX &&
    normalized.startsWith(COLLECTOR_CODE_PREFIX)
  )
}
