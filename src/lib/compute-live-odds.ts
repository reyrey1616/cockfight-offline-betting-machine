// Mirrors `cockfigh-offline-betting-api/src/lib/odds.js` — keep formulas aligned.

function toNumber(decimalLike: string | number | null | undefined): number {
  if (decimalLike == null) return 0
  if (typeof decimalLike === 'number') return decimalLike
  if (typeof decimalLike === 'string') return Number(decimalLike)
  return Number(decimalLike)
}

function floor2(n: number): number {
  return Math.floor(n * 100) / 100
}

function poolDistributable(
  meron: number,
  wala: number,
  commissionRate: number
): number {
  const total = meron + wala
  return total * (1 - commissionRate / 2)
}

export function computeLiveOdds(fight: {
  meronPool: string
  walaPool: string
  commissionRate: string
}): { meronOdds: number | null; walaOdds: number | null } {
  const meron = toNumber(fight.meronPool)
  const wala = toNumber(fight.walaPool)
  const commission = toNumber(fight.commissionRate)
  const distributable = poolDistributable(meron, wala, commission)

  const meronOdds = meron > 0 ? floor2(distributable / meron) : null
  const walaOdds = wala > 0 ? floor2(distributable / wala) : null

  return { meronOdds, walaOdds }
}
