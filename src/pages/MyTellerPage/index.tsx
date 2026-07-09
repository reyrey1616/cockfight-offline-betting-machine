import { useDashboardRealtime } from '@/hooks/useDashboardRealtime'
import { UNPAID_PAYOUT_DASHBOARD_MINUTES } from '@/constants'
import { UnpaidPayoutsTable } from '@/pages/DashboardPage/tables/UnpaidPayoutsTable'
import { useAuthUser } from '@/store/auth'

/**
 * Teller desk: unpaid winners and pending refunds older than the dashboard window
 * after fight result (aged off the admin dashboard).
 */
export function MyTellerPage() {
  const user = useAuthUser()
  useDashboardRealtime()

  const resolveTellerName = (id: string) => (id === user?.id ? user.fullName : id)
  const windowMinutes = UNPAID_PAYOUT_DASHBOARD_MINUTES

  return (
    <div className="space-y-4 p-4 pb-10">
      <div className="border-b pb-4">
        <h1 className="text-xl font-semibold tracking-tight">My teller</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Unpaid winning tickets and pending refunds from fights settled more than{' '}
          {windowMinutes} minutes ago. These no longer appear on the admin dashboard but can
          still be paid at the payout machine.
        </p>
      </div>

      <UnpaidPayoutsTable
        ageFilter="my-teller-archived"
        resolveTellerName={resolveTellerName}
      />
    </div>
  )
}
