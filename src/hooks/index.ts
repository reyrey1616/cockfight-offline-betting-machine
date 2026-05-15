// TanStack Query hooks + other React hooks live here.
// Plain HTTP functions stay in `@/lib/api-*.ts` so they stay importable
// from tests, scripts, and non-React code without pulling in React.

export { useLogin, useLogout, useMe } from './useAuth'
export { useFightAdminMutations } from './useFightAdminMutations'
export { useDashboardRealtime } from './useDashboardRealtime'
export type { DashboardWsStatus } from './useDashboardRealtime'
export { useFightLiveState } from './useFightLiveState'
export type { WsConnectionStatus } from './useFightLiveState'
export { useFightBoardViewModel } from './useFightBoardViewModel'
export { useFightWinnerFlash } from './useFightWinnerFlash'
export type { FightWinnerFlash, UseFightWinnerFlashOptions } from './useFightWinnerFlash'
export { usePlaceBet } from './usePlaceBet'
export { useRecentFightsBoard } from './useRecentFightsBoard'
export { useCollectorsList, useCreateCollector, useUpdateCollector } from './useCollectors'
export { useSettings, useUpdateSettings } from './useSettings'
export {
  useResetSession,
  useSessionResetPreview,
  useSessionResets,
} from './useSession'
export { useCreateUser, useResetUserPassword, useTellersList, useUpdateUser } from './useUsers'
export { useCashAdvance, useCashBalance, useCashRemit, useSetCashBalance } from './useCash'
