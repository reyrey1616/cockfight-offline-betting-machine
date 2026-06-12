import { describe, expect, it } from 'vitest'

import {
  addQuickStakeAmount,
  formatStakeDisplay,
  parseStakeInput,
  parseStakeRawValue,
  sanitizeStakeInput,
  stakeToWireAmount,
  stakeValidationMessage
} from '@/lib/teller-stake'

describe('sanitizeStakeInput', () => {
  it('strips letters and symbols', () => {
    expect(sanitizeStakeInput('rejgher')).toBe('')
    expect(sanitizeStakeInput('1a2b3')).toBe('123')
    expect(sanitizeStakeInput('1,234.50')).toBe('1234.50')
  })

  it('allows one decimal with at most two fractional digits', () => {
    expect(sanitizeStakeInput('100.')).toBe('100.')
    expect(sanitizeStakeInput('100.999')).toBe('100.99')
    expect(sanitizeStakeInput('12.34.56')).toBe('12.34')
  })
})

describe('addQuickStakeAmount', () => {
  it('adds preset amounts cumulatively', () => {
    expect(addQuickStakeAmount('', 100)).toBe('100')
    expect(addQuickStakeAmount('100', 100)).toBe('200')
    expect(addQuickStakeAmount(addQuickStakeAmount('', 100), 100)).toBe('200')
    expect(addQuickStakeAmount(addQuickStakeAmount(addQuickStakeAmount('', 100), 100), 100)).toBe(
      '300'
    )
  })

  it('adds to typed amounts including decimals', () => {
    expect(addQuickStakeAmount('1,500', 500)).toBe('2000')
    expect(addQuickStakeAmount('100.50', 100)).toBe('200.50')
  })

  it('caps at the maximum stake', () => {
    expect(addQuickStakeAmount('999900', 500)).toBe('1000000')
    expect(addQuickStakeAmount('1000000', 100)).toBe('1000000')
  })
})

describe('parseStakeRawValue', () => {
  it('returns 0 for empty or invalid input', () => {
    expect(parseStakeRawValue('')).toBe(0)
    expect(parseStakeRawValue('.')).toBe(0)
    expect(parseStakeRawValue('abc')).toBe(0)
  })

  it('parses formatted and plain numbers', () => {
    expect(parseStakeRawValue('1,500')).toBe(1500)
    expect(parseStakeRawValue('100.25')).toBe(100.25)
  })
})

describe('formatStakeDisplay', () => {
  it('adds thousand separators while preserving decimals', () => {
    expect(formatStakeDisplay('100')).toBe('100')
    expect(formatStakeDisplay('1000')).toBe('1,000')
    expect(formatStakeDisplay('1234567')).toBe('1,234,567')
    expect(formatStakeDisplay('1000.')).toBe('1,000.')
    expect(formatStakeDisplay('1000.5')).toBe('1,000.5')
    expect(formatStakeDisplay('1000.50')).toBe('1,000.50')
    expect(formatStakeDisplay('.5')).toBe('.5')
  })
})

describe('parseStakeInput', () => {
  it('parses valid amounts', () => {
    expect(parseStakeInput('100')).toBe(100)
    expect(parseStakeInput('250.50')).toBe(250.5)
  })

  it('rejects empty, zero, and over max', () => {
    expect(parseStakeInput('')).toBeNull()
    expect(parseStakeInput('.')).toBeNull()
    expect(parseStakeInput('0')).toBeNull()
    expect(parseStakeInput('99.99')).toBeNull()
    expect(parseStakeInput('1000001')).toBeNull()
  })
})

describe('stakeValidationMessage', () => {
  it('returns null for valid stake', () => {
    expect(stakeValidationMessage(100)).toBeNull()
  })

  it('returns message for invalid stake', () => {
    expect(stakeValidationMessage(null)).toMatch(/valid amount/i)
  })

  it('enforces minimum stake', () => {
    expect(stakeValidationMessage(99.99)).toMatch(/minimum stake is 100/i)
    expect(stakeValidationMessage(100)).toBeNull()
  })
})

describe('stakeToWireAmount', () => {
  it('rounds to two decimal places', () => {
    expect(stakeToWireAmount(10.005)).toBe(10.01)
  })
})
