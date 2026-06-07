import { describe, expect, it } from 'vitest'

import {
  isCompleteCollectorCode,
  sanitizeCollectorCodeInput
} from '@/lib/collector-scan'

describe('collector-scan', () => {
  it('normalizes scan input to uppercase alphanumeric', () => {
    expect(sanitizeCollectorCodeInput('col-ab12!')).toBe('COLAB12')
  })

  it('detects a complete collector code', () => {
    expect(isCompleteCollectorCode('COLABCDE')).toBe(true)
    expect(isCompleteCollectorCode('COLABC')).toBe(false)
  })
})
