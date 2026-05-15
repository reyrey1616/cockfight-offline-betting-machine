import { FightBoardPage } from '@/pages/FightBoardPage'

/** Admin-only — fight lifecycle + board (route guarded in `router.tsx`). */
export function RealTimeOddsPage() {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Operate fights</h1>
      <FightBoardPage mode="admin" layout="embedded" />
    </div>
  )
}
