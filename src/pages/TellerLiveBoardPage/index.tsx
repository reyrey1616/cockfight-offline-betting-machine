import { TellerChromeHeader } from '@/components/TellerChromeHeader'
import { FightBoardLayout } from '@/components/fight-board/FightBoardLayout'
import { FightWinnerOverlay } from '@/components/fight-board/FightWinnerOverlay'
import { ConnectionStatus } from '@/components/fight-board/ConnectionStatus'
import { TellerBettingHistory } from '@/components/teller-betting/TellerBettingHistory'
import { TellerBettingPanel } from '@/components/teller-betting/TellerBettingPanel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useFightBoardViewModel, useFightWinnerFlash } from '@/hooks'

/**
 * Full-viewport teller kiosk: live fight board + stake entry + ticket history.
 * Routed at `/kiosk` (outside `AppLayout`) with `RequireRole allow={TELLER}` only.
 */
export function TellerLiveBoardPage() {
  const vm = useFightBoardViewModel()
  const { flash } = useFightWinnerFlash(vm.fight)

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background">
      <TellerChromeHeader
        surface="dark"
        trailing={
          <ConnectionStatus
            status={vm.wsStatus}
            lastError={vm.lastWsError}
            surface="dark"
          />
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
        {vm.fightsQuery.isError ? (
          <Alert variant="destructive" className="mb-3">
            <AlertTitle>Could not load fights</AlertTitle>
            <AlertDescription>{vm.loadError ?? 'Request failed.'}</AlertDescription>
          </Alert>
        ) : null}

        {vm.loading ? (
          <p className="mb-3 text-sm text-muted-foreground">Loading fight context…</p>
        ) : null}

        <div className="flex min-h-0 flex-col gap-3 xl:flex-row xl:items-stretch">
          <div className="relative min-h-0 min-w-0 flex-1 xl:min-h-[min(100%,520px)]">
            <FightWinnerOverlay flash={flash} />
            <FightBoardLayout
              meronPool={vm.meronPool}
              walaPool={vm.walaPool}
              meronOdds={vm.meronOdds}
              walaOdds={vm.walaOdds}
              meronSideHeld={vm.meronSideHeld}
              walaSideHeld={vm.walaSideHeld}
              fightNumber={vm.fightNumber}
              fightStatus={vm.fightStatus}
              sessionStats={vm.sessionStats}
              history={vm.history}
              tickerMessage={vm.tickerMessage}
              variant="embedded"
            />
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 xl:w-[min(100%,28rem)] xl:max-w-[28rem]">
            <TellerBettingPanel fight={vm.fight} />
            <TellerBettingHistory fight={vm.fight} />
          </div>
        </div>
      </div>
    </div>
  )
}
