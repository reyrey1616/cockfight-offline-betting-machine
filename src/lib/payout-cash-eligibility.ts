import { formatMoney } from '@/lib/format-money'

export interface PayoutCashCheck {
  ok: boolean
  message: string | null
}

/** True when teller drawer balance covers the ticket payout. */
export function canPayFromCashOnHand(cashOnHand: string | number, payoutAmount: string | number): boolean {
  const balance = Number(cashOnHand)
  const payout = Number(payoutAmount)
  if (!Number.isFinite(balance) || !Number.isFinite(payout)) return false
  return balance >= payout
}

export function payoutCashShortfallMessage(
  cashOnHand: string | number,
  payoutAmount: string | number
): string {
  const balance = Number(cashOnHand)
  const payout = Number(payoutAmount)
  const balanceText = Number.isFinite(balance) ? formatMoney(String(balance.toFixed(2))) : '—'
  const payoutText = Number.isFinite(payout) ? formatMoney(String(payout.toFixed(2))) : '—'
  return `Payout cannot be done — cash on hand is short. Available ${balanceText}, payout ${payoutText}.`
}

export function checkPayoutCashOnHand(
  cashOnHand: string | number | null | undefined,
  payoutAmount: string | number | null | undefined
): PayoutCashCheck {
  if (payoutAmount == null || payoutAmount === '') {
    return { ok: false, message: 'This ticket has no payout amount.' }
  }
  if (cashOnHand == null || cashOnHand === '') {
    return { ok: false, message: 'Could not verify cash on hand. Try again.' }
  }
  if (canPayFromCashOnHand(cashOnHand, payoutAmount)) {
    return { ok: true, message: null }
  }
  return {
    ok: false,
    message: payoutCashShortfallMessage(cashOnHand, payoutAmount)
  }
}
