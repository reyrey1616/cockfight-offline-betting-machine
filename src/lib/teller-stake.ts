/**
 * Pure helpers for teller stake entry (no React).
 * Amounts are validated against API rules: >= 100, ≤ 1_000_000, 2 decimal places.
 */
export const TELLER_STAKE_QUICK_AMOUNTS = [
  100, 200, 300, 500, 1000, 5000, 10_000, 20_000
] as const

const MAX_STAKE = 1_000_000
const MIN_STAKE = 100

/**
 * Allow only digits and one decimal point; at most two fractional digits;
 * strip other characters (letters, commas, spaces).
 */
export function sanitizeStakeInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '')
  if (cleaned === '') return ''

  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) {
    return cleaned.slice(0, 12)
  }

  const intPart = cleaned.slice(0, firstDot).replace(/\./g, '').slice(0, 12)
  const afterFirstDot = cleaned.slice(firstDot + 1)
  const fractionalSegment = afterFirstDot.split('.')[0] ?? ''
  const fracDigits = fractionalSegment.replace(/\D/g, '').slice(0, 2)

  const endsWithBareDot =
    cleaned.endsWith('.') && afterFirstDot.replace(/\./g, '') === ''

  if (endsWithBareDot) {
    return intPart === '' ? '.' : `${intPart}.`
  }

  return fracDigits.length > 0 ? `${intPart}.${fracDigits}` : intPart
}

/** Thousand separators for the teller amount field while typing. */
export function formatStakeDisplay(raw: string): string {
  if (raw === '') return ''
  if (raw === '.') return '.'

  const endsWithDot = raw.endsWith('.')
  const dotIndex = raw.indexOf('.')
  const intPart = dotIndex === -1 ? raw : raw.slice(0, dotIndex)
  const fracPart = dotIndex === -1 ? undefined : raw.slice(dotIndex + 1)

  const formattedInt =
    intPart === ''
      ? ''
      : Number(intPart).toLocaleString(undefined, { maximumFractionDigits: 0 })

  if (endsWithDot && (fracPart === undefined || fracPart === '')) {
    return `${formattedInt}.`
  }
  if (fracPart !== undefined) {
    return `${formattedInt}.${fracPart}`
  }
  return formattedInt
}

/** Parse kiosk-style numeric string (optional commas) to a finite stake or null. */
export function parseStakeInput(raw: string): number | null {
  const t = raw.trim().replace(/,/g, '')
  if (t === '' || t === '.') return null
  const n = Number(t)
  if (!Number.isFinite(n) || n < MIN_STAKE) return null
  if (n > MAX_STAKE) return null
  return roundMoney(n)
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

/** Wire amount for POST /bets (number with ≤ 2 dp). */
export function stakeToWireAmount(n: number): number {
  return roundMoney(n)
}

export function stakeValidationMessage(parsed: number | null): string | null {
  if (parsed === null) return 'Enter a valid amount.'
  if (parsed < MIN_STAKE) return `Minimum stake is ${MIN_STAKE.toLocaleString()}.`
  if (parsed > MAX_STAKE) return `Maximum stake is ${MAX_STAKE.toLocaleString()}.`
  return null
}
