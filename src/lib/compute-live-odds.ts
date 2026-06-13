// Mirrors `cockfigh-offline-betting-api/src/lib/odds.js` — keep formulas aligned.

function toNumber(decimalLike: string | number | null | undefined): number {
  if (decimalLike == null) return 0
  if (typeof decimalLike === 'number') return decimalLike
  if (typeof decimalLike === 'string') return Number(decimalLike)
  return Number(decimalLike)
}

/** Match API `floorPayoutMultiplier` — 4 dp on ratio, not 2. */
function floorPayoutMultiplier(ratio: number): number {
  return Math.floor(ratio * 10000) / 10000
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

  const meronOdds =
    meron > 0 ? floorPayoutMultiplier(distributable / meron) : null
  const walaOdds = wala > 0 ? floorPayoutMultiplier(distributable / wala) : null

  return { meronOdds, walaOdds }
}
