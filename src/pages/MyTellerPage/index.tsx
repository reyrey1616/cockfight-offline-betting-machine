import { useDashboardRealtime } from '@/hooks/useDashboardRealtime'
import { MyTellerTable } from '@/pages/DashboardPage/tables/MyTeller'
import { useAuthUser } from '@/store/auth'


export function MyTellerPage() {
  const user = useAuthUser()
  useDashboardRealtime()

  const resolveTellerName = (id: string) => (id === user?.id ? user.fullName : id)

  return (
    <div className="space-y-4 p-4 pb-10">
      <MyTellerTable
        ageFilter="my-teller-archived"
        resolveTellerName={resolveTellerName}
      />
    </div>
  )
}
