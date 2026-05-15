// Mirrors `cockfigh-offline-betting-api/src/lib/odds.js` — keep formulas aligned.

function toNumber(decimalLike: string | number | null | undefined): number {
  if (decimalLike == null) return 0
  if (typeof decimalLike === 'number') return decimalLike
  if (typeof decimalLike === 'string') return Number(decimalLike)
  return Number(decimalLike)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function computeLiveOdds(fight: {
  meronPool: string
  walaPool: string
  commissionRate: string
}): { meronOdds: number | null; walaOdds: number | null } {
  const meron = toNumber(fight.meronPool)
  const wala = toNumber(fight.walaPool)
  const commission = toNumber(fight.commissionRate)
  const keepRate = 1 - commission

  const meronOdds =
    meron > 0 ? round2(1 + (wala * keepRate) / meron) : null
  const walaOdds = wala > 0 ? round2(1 + (meron * keepRate) / wala) : null

  return { meronOdds, walaOdds }
}
