import { listBets } from '@/lib/api-bets'

/** Count non-voided bets and sum stake for the session scope. */
export async function aggregateSessionBets(tellerId?: string): Promise<{
  betCount: number
  grossHandle: string
}> {
  let cursor: string | undefined
  let betCount = 0
  let grossCents = 0

  do {
    const page = await listBets({ tellerId, limit: 200, cursor })
    for (const bet of page.bets) {
      if (bet.status === 'VOIDED') continue
      betCount += 1
      grossCents += Math.round(Number(bet.amount) * 100)
    }
    cursor = page.nextCursor ?? undefined
  } while (cursor)

  return {
    betCount,
    grossHandle: (grossCents / 100).toFixed(2)
  }
}
