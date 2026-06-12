import { useMemo, useState } from 'react'

import { Label } from '@/components/ui/label'
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime'
import { useTellersList } from '@/hooks/useUsers'
import { USER_ROLE_VALUE } from '@/constants'
import { useAuthUser } from '@/store/auth'

import { BettingTransactionsTable } from './tables/BettingTransactionsTable'
import { CashFlowLedgerTable } from './tables/CashFlowLedgerTable'
import { CashOnHandTable } from './tables/CashOnHandTable'
import { PayoutHistoryLedgerTable } from './tables/PayoutHistoryLedgerTable'
import { RemittanceLedgerTable } from './tables/RemittanceLedgerTable'
import { FightCommissionTable } from './tables/FightCommissionTable'
import { TellerCommissionsTable } from './tables/TellerCommissionsTable'
import { CancelledTicketsTable } from './tables/CancelledTicketsTable'
import { WinningTicketsTable } from './tables/WinningTicketsTable'

export function DashboardPage() {
  const user = useAuthUser()
  const isAdmin = user?.role === 'ADMIN'
  const [selectedTellerId, setSelectedTellerId] = useState<string | 'ALL'>('ALL')

  const tellersQuery = useTellersList({ enabled: Boolean(isAdmin) })
  const { wsStatus, lastWsError } = useDashboardRealtime()

  const apiTellerId = useMemo(() => {
    if (!user) return undefined
    if (user.role !== 'ADMIN') return user.id
    return selectedTellerId === 'ALL' ? undefined : selectedTellerId
  }, [user, selectedTellerId])

  const tellerNameMap = useMemo(() => {
    const m = new Map<string, string>()
    if (user) m.set(user.id, user.fullName)
    for (const u of tellersQuery.data?.users ?? []) {
      m.set(u.id, u.fullName)
    }
    return m
  }, [user, tellersQuery.data])

  const resolveTellerName = (id: string) => tellerNameMap.get(id) ?? id.slice(0, 8)

  const tellerIdsForBalances = useMemo(() => {
    if (!user) return []
    if (user.role !== 'ADMIN') return [user.id]
    if (selectedTellerId === 'ALL') {
      return (tellersQuery.data?.users ?? [])
        .filter((u) => u.role === USER_ROLE_VALUE.TELLER)
        .map((u) => u.id)
    }
    return [selectedTellerId]
  }, [user, selectedTellerId, tellersQuery.data])

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-col gap-2 border-b pb-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Live ledgers, balances, winning tickets, and fight commission.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {isAdmin ? (
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="dash-teller"
                className="text-[10px] uppercase tracking-wide text-muted-foreground"
              >
                Teller
              </Label>
              <select
                id="dash-teller"
                className="h-8 min-w-[11rem] rounded-md border border-input bg-background px-2 text-xs shadow-sm"
                value={selectedTellerId}
                onChange={(e) =>
                  setSelectedTellerId(e.target.value === 'ALL' ? 'ALL' : e.target.value)
                }
              >
                <option value="ALL">All tellers</option>
                {(tellersQuery.data?.users ?? [])
                  .filter((u) => u.role === USER_ROLE_VALUE.TELLER)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.username})
                    </option>
                  ))}
              </select>
            </div>
          ) : null}
          <div className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Realtime: </span>
            {wsStatus}
            {lastWsError ? <span className="text-destructive"> — {lastWsError}</span> : null}
          </div>
        </div>
      </div>

      {/* Betting activity + voided tickets */}
      <div className="grid gap-3 lg:grid-cols-[7fr_3fr]">
        <BettingTransactionsTable
          tellerId={apiTellerId}
          resolveTellerName={resolveTellerName}
          searchEnabled={isAdmin}
          panelClassName="border-red-300 bg-red-50/90 dark:border-red-900 dark:bg-red-950/40"
        />
        <CancelledTicketsTable
          tellerId={apiTellerId}
          resolveTellerName={resolveTellerName}
          panelClassName="border-rose-300 bg-rose-50/90 dark:border-rose-900 dark:bg-rose-950/40"
        />
      </div>

      {/* Teller deposits (cash in) + remittances (cash out to collector) */}
      <div className="grid gap-3 lg:grid-cols-2">
        <CashFlowLedgerTable
          tellerId={apiTellerId}
          resolveTellerName={resolveTellerName}
          panelClassName="border-orange-300 bg-orange-50/90 dark:border-orange-900 dark:bg-orange-950/40"
        />
        <RemittanceLedgerTable
          tellerId={apiTellerId}
          resolveTellerName={resolveTellerName}
          panelClassName="border-amber-300 bg-amber-50/90 dark:border-amber-900 dark:bg-amber-950/40"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <CashOnHandTable
          tellerIds={tellerIdsForBalances}
          panelClassName="border-pink-300 bg-pink-50/90 dark:border-pink-900 dark:bg-pink-950/40"
        />
        <PayoutHistoryLedgerTable
          tellerId={apiTellerId}
          resolveTellerName={resolveTellerName}
          panelClassName="border-emerald-300 bg-emerald-50/90 dark:border-emerald-900 dark:bg-emerald-950/40"
        />
      </div>

      <WinningTicketsTable
        tellerId={apiTellerId}
        resolveTellerName={resolveTellerName}
        panelClassName="border-violet-300 bg-violet-50/90 dark:border-violet-900 dark:bg-violet-950/40"
      />

      {isAdmin ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <TellerCommissionsTable
            filterTellerId={apiTellerId}
            enabled={isAdmin}
            panelClassName="border-teal-300 bg-teal-50/90 dark:border-teal-900 dark:bg-teal-950/40"
          />
          <FightCommissionTable
            enabled={isAdmin}
            panelClassName="border-slate-300 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-950/40"
          />
        </div>
      ) : null}
    </div>
  )
}
