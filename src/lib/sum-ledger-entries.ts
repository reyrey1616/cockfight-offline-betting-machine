import { listLedger } from '@/lib/api-cash'
import type { LedgerEntryTypeWire } from '@/types/api'

/** Sum all ledger rows for a type, following cursor pages until exhausted. */
export async function sumLedgerEntries(params: {
  type: LedgerEntryTypeWire
  tellerId?: string
}): Promise<number> {
  let cursor: string | undefined
  let total = 0

  do {
    const page = await listLedger({
      type: params.type,
      tellerId: params.tellerId,
      limit: 200,
      cursor
    })
    for (const entry of page.entries) {
      const n = Number(entry.amount)
      if (Number.isFinite(n)) total += n
    }
    cursor = page.nextCursor ?? undefined
  } while (cursor)

  return total
}
