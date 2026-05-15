import { describe, expect, it } from 'vitest'

import {
  parseStakeInput,
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

describe('parseStakeInput', () => {
  it('parses valid amounts', () => {
    expect(parseStakeInput('100')).toBe(100)
    expect(parseStakeInput('250.50')).toBe(250.5)
  })

  it('rejects empty, zero, and over max', () => {
    expect(parseStakeInput('')).toBeNull()
    expect(parseStakeInput('.')).toBeNull()
    expect(parseStakeInput('0')).toBeNull()
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
})

describe('stakeToWireAmount', () => {
  it('rounds to two decimal places', () => {
    expect(stakeToWireAmount(10.005)).toBe(10.01)
  })
})
