import type { BetByCodeResponse, BetListRow, BetRow, PlaceBetFightSummary } from '@/types/api'

/** Merge a bet row with fight summary fields returned by list / lookup APIs. */
export function toBetListRow(bet: BetRow, fight: PlaceBetFightSummary): BetListRow {
  return {
    ...bet,
    fightNumber: fight.fightNumber,
    fightStatus: fight.status,
    meronOdds: fight.meronOdds,
    walaOdds: fight.walaOdds,
    payoutRatioMeron: fight.payoutRatioMeron,
    payoutRatioWala: fight.payoutRatioWala
  }
}

export function betListRowFromLookup(response: BetByCodeResponse): BetListRow {
  return toBetListRow(response.bet, response.fight)
}
