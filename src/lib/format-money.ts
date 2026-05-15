/** Format API decimal strings (pools, payouts) for display. */
export function formatMoney(amount: string): string {
  const n = Number(amount)
  if (Number.isNaN(n)) return amount
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
