import { useCallback, useMemo, useState, type ChangeEvent } from 'react'

import {
  formatStakeDisplay,
  parseStakeInput,
  sanitizeStakeInput,
  stakeValidationMessage,
  TELLER_STAKE_QUICK_AMOUNTS
} from '@/lib/teller-stake'

/** Local stake string for the teller amount field (typed + quick presets). */
export function useTellerStakeDraft() {
  const [raw, setRaw] = useState('')

  const parsed = useMemo(() => parseStakeInput(raw), [raw])
  const validationError = useMemo(() => stakeValidationMessage(parsed), [parsed])

  const setFromInput = useCallback((value: string) => {
    setRaw(sanitizeStakeInput(value))
  }, [])

  const onInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFromInput(e.target.value)
  }, [setFromInput])

  const clear = useCallback(() => {
    setRaw('')
  }, [])

  const applyQuick = useCallback((n: number) => {
    setRaw(sanitizeStakeInput(String(n)))
  }, [])

  return {
    rawDisplay: formatStakeDisplay(raw),
    parsed,
    validationError,
    onInputChange,
    clear,
    applyQuick,
    quickAmounts: TELLER_STAKE_QUICK_AMOUNTS
  }
}
