import { describe, expect, it } from 'vitest'

import { resolvePrinterFromList } from '../../shared/printer-resolve.mjs'

describe('resolvePrinterFromList', () => {
  const copies = [
    { name: 'XP-80C (copy 3)', isDefault: false, status: 0x80 },
    { name: 'XP-80C (copy 1)', isDefault: true, status: 0 },
    { name: 'Microsoft Print to PDF', isDefault: false, status: 0 }
  ]

  it('uses Windows default physical printer, not the first thermal in list order', () => {
    expect(resolvePrinterFromList(copies, '')).toBe('XP-80C (copy 1)')
  })

  it('honors an explicit configured printer name', () => {
    expect(resolvePrinterFromList(copies, 'XP-80C (copy 3)')).toBe('XP-80C (copy 3)')
  })

  it('skips offline thermals when no default is set', () => {
    const noDefault = [
      { name: 'XP-80C (copy 3)', isDefault: false, status: 0x80 },
      { name: 'XP-80C (copy 1)', isDefault: false, status: 0 }
    ]
    expect(resolvePrinterFromList(noDefault, '')).toBe('XP-80C (copy 1)')
  })
})
