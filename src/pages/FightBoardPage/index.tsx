import { toast } from 'sonner'

import { FightBoardLayout } from '@/components/fight-board/FightBoardLayout'
import { FightWinnerOverlay } from '@/components/fight-board/FightWinnerOverlay'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/lib/api'
import { useFightAdminMutations, useFightBoardViewModel, useFightWinnerFlash } from '@/hooks'

import { ConnectionStatus } from '@/components/fight-board/ConnectionStatus'
import { FightAdminToolbar } from '@/pages/RealTimeOddsPage/FightAdminToolbar'

export type FightBoardMode = 'display' | 'teller' | 'admin'

export interface FightBoardPageProps {
  mode: FightBoardMode
  /** `fullscreen` = TV route (`/display`); `embedded` = under app chrome */
  layout?: 'embedded' | 'fullscreen'
}

function showMutationError(e: Error) {
  toast.error(e instanceof ApiError ? e.message : e.message)
}

export function FightBoardPage({ mode, layout = 'embedded' }: FightBoardPageProps) {
  const showAdminControls = mode === 'admin'
  const showConnection = mode !== 'display'

  const vm = useFightBoardViewModel()
  const { flash } = useFightWinnerFlash(vm.fight, { enabled: mode !== 'admin' })
  const m = useFightAdminMutations(vm.applyServerFight)

  const boardVariant = layout === 'fullscreen' ? 'fullscreen' : 'embedded'

  const shellClass =
    layout === 'fullscreen'
      ? 'flex min-h-dvh flex-col bg-black'
      : 'space-y-4'

  return (
    <div className={shellClass}>
      {showConnection ? (
        <div
          className={
            layout === 'fullscreen'
              ? 'flex items-center justify-end gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-2'
              : 'flex items-center justify-end gap-2'
          }
        >
          <ConnectionStatus
            status={vm.wsStatus}
            lastError={vm.lastWsError}
            surface={layout === 'fullscreen' ? 'dark' : 'default'}
          />
        </div>
      ) : null}

      {vm.fightsQuery.isError ? (
        <div className={layout === 'fullscreen' ? 'p-4' : ''}>
          <Alert variant="destructive">
            <AlertTitle>Could not load fights</AlertTitle>
            <AlertDescription>{vm.loadError ?? 'Request failed.'}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {vm.loading ? (
        <p
          className={
            layout === 'fullscreen'
              ? 'px-4 text-sm text-zinc-500'
              : 'text-sm text-muted-foreground'
          }
        >
          Loading fight context…
        </p>
      ) : null}

      {!vm.fight && !vm.loading && showAdminControls ? (
        <div className={layout === 'fullscreen' ? 'p-4' : ''}>
          <Card className={layout === 'fullscreen' ? 'border-zinc-800 bg-zinc-900 text-zinc-100' : ''}>
            <CardHeader>
              <CardTitle>No fight on screen</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                className="min-h-14 px-6 text-base font-semibold"
                disabled={m.createFight.isPending}
                onClick={() =>
                  m.createFight.mutate(undefined, {
                    onSuccess: () => toast.success('Fight opened'),
                    onError: showMutationError
                  })
                }
              >
                {m.createFight.isPending ? 'Opening…' : 'Open new fight'}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {!vm.fight && !vm.loading && !showAdminControls ? (
        <p
          className={
            layout === 'fullscreen' ? 'px-4 text-center text-zinc-500' : 'text-sm text-muted-foreground'
          }
        >
          {mode === 'display'
            ? 'Waiting for the next fight…'
            : 'Ask an admin to open the next fight.'}
        </p>
      ) : null}

      <div className={layout === 'fullscreen' ? 'flex flex-1 flex-col p-2' : ''}>
        {mode !== 'admin' ? <FightWinnerOverlay flash={flash} /> : null}
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
          variant={boardVariant}
        />
      </div>

      {vm.fight && showAdminControls ? (
        <div className={layout === 'fullscreen' ? 'border-t border-zinc-800 bg-zinc-950 p-4' : ''}>
          <Card
            className={
              layout === 'fullscreen' ? 'border-zinc-800 bg-zinc-900 text-zinc-100' : ''
            }
          >
            <CardHeader>
              <CardTitle className="text-lg">Fight control</CardTitle>
            </CardHeader>
            <CardContent>
              <FightAdminToolbar
                fight={vm.fight}
                createFight={m.createFight}
                closeFight={m.closeFight}
                reopenFight={m.reopenFight}
                settleFight={m.settleFight}
                cancelFight={m.cancelFight}
                holdSide={m.holdSide}
                unholdSide={m.unholdSide}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
