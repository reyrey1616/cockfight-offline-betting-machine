import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BET_SIDE_VALUE, FIGHT_STATUS_LABEL } from '@/constants'
import { ApiError } from '@/lib/api'
import { formatMoney } from '@/lib/format-money'
import { stakeToWireAmount } from '@/lib/teller-stake'
import { isSideHeld } from '@/lib/fight-board-derive'
import { cn } from '@/lib/utils'
import { usePlaceBet } from '@/hooks/usePlaceBet'
import { useTellerStakeDraft } from '@/hooks/useTellerStakeDraft'
import type { BetSideWire, Fight } from '@/types/api'

function SideBetButton({
  side,
  label,
  disabled,
  active,
  onSubmit,
  variant
}: {
  side: BetSideWire
  label: string
  disabled: boolean
  active: boolean
  onSubmit: (s: BetSideWire) => void
  variant: 'meron' | 'wala'
}) {
  const base =
    variant === 'meron'
      ? 'bg-red-600 hover:bg-red-700 text-white border-red-800'
      : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-800'
  const ring = active ? 'ring-2 ring-offset-2 ring-amber-400 ring-offset-background' : ''
  return (
    <Button
      type="button"
      size="lg"
      disabled={disabled}
      className={cn(
        'h-14 flex-1 text-base font-black uppercase tracking-wide shadow-md',
        base,
        ring
      )}
      onClick={() => onSubmit(side)}
    >
      {label}
    </Button>
  )
}

export interface TellerBettingPanelProps {
  fight: Fight | null
  className?: string
}

/**
 * Teller stake entry + side selection. Presentation split from HTTP via
 * `useTellerStakeDraft` + `usePlaceBet`; pure parsing lives in `teller-stake`.
 */
export function TellerBettingPanel({ fight, className }: TellerBettingPanelProps) {
  const draft = useTellerStakeDraft()
  const placeBet = usePlaceBet()

  const canBet =
    fight != null &&
    (fight.status === 'OPEN' || fight.status === 'LAST_CALL') &&
    draft.parsed != null &&
    draft.validationError == null

  const meronBlocked = isSideHeld(fight, 'MERON')
  const walaBlocked = isSideHeld(fight, 'WALA')

  const pendingSide = placeBet.isPending ? placeBet.variables?.side ?? null : null

  function submit(side: BetSideWire) {
    if (!fight || !draft.parsed) return
    const amount = stakeToWireAmount(draft.parsed)
    placeBet.mutate(
      { fightId: fight.id, side, amount },
      {
        onSuccess: (res) => {
          draft.clear()
          toast.success(
            res.replay
              ? `Ticket ${res.bet.code} (already recorded)`
              : `Ticket ${res.bet.code} — ${formatMoney(res.bet.amount)} on ${side}`
          )
        },
        onError: (e) => {
          const msg = e instanceof ApiError ? e.message : e.message
          toast.error(msg)
        }
      }
    )
  }

  const busy = placeBet.isPending

  const statusLabel =
    fight != null ? (FIGHT_STATUS_LABEL[fight.status] ?? fight.status) : ''

  return (
    <Card className={cn('border-2 border-zinc-300 shadow-md', className)}>
      <CardHeader className="border-b bg-muted/40 py-3">
        <CardTitle className="text-base font-bold tracking-tight">Betting</CardTitle>
        <p className="text-xs text-muted-foreground">
          {fight == null
            ? 'No active fight.'
            : fight.status !== 'OPEN' && fight.status !== 'LAST_CALL'
              ? `Fight #${fight.fightNumber} is ${statusLabel} — betting locked.`
              : fight.status === 'LAST_CALL'
                ? `Fight #${fight.fightNumber} is LAST CALL — place bets now, closing anytime soon.`
                : `Fight #${fight.fightNumber} — type amount (digits and . only), then tap Meron or Wala.`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="teller-amt" className="text-xs font-bold uppercase tracking-wide">
            Enter amount
          </Label>
          <div className="flex gap-2">
            <Input
              id="teller-amt"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
              value={draft.rawDisplay}
              onChange={draft.onInputChange}
              placeholder="0"
              className="h-12 min-w-0 flex-1 text-right text-2xl font-black tabular-nums tracking-tight"
              aria-invalid={draft.validationError != null && draft.rawDisplay.length > 0}
            />
            <Button
              type="button"
              variant="outline"
              className="h-12 shrink-0 px-4"
              disabled={busy}
              onClick={() => draft.clear()}
            >
              Clear
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Minimum bet is 100. Type an amount or tap presets to add (e.g. 100 + 100 = 200).
          </p>
          {draft.validationError && draft.rawDisplay.length > 0 ? (
            <p className="text-xs text-destructive">{draft.validationError}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {draft.quickAmounts.map((n) => (
            <Button
              key={n}
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold tabular-nums"
              disabled={busy}
              onClick={() => draft.applyQuick(n)}
            >
              {n.toLocaleString()}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <SideBetButton
            side={BET_SIDE_VALUE.MERON}
            label="Meron"
            variant="meron"
            disabled={busy || !canBet || meronBlocked}
            active={pendingSide === BET_SIDE_VALUE.MERON}
            onSubmit={submit}
          />
          <SideBetButton
            side={BET_SIDE_VALUE.WALA}
            label="Wala"
            variant="wala"
            disabled={busy || !canBet || walaBlocked}
            active={pendingSide === BET_SIDE_VALUE.WALA}
            onSubmit={submit}
          />
        </div>

        {meronBlocked || walaBlocked ? (
          <p className="text-center text-xs text-amber-700 dark:text-amber-400">
            {meronBlocked ? 'Meron side is held — no new Meron bets. ' : null}
            {walaBlocked ? 'Wala side is held — no new Wala bets.' : null}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
