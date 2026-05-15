import { useState } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  BET_SIDE_LABEL,
  BET_SIDE_VALUE,
  FIGHT_STATUS_LABEL,
  type BetSideValue
} from '@/constants'
import { ApiError } from '@/lib/api'
import type {
  CancelFightRequest,
  CreateFightResponse,
  Fight,
  FightActionResponse,
  SettleFightOutcome,
  SettleFightRequest
} from '@/types/api'

import { CancelFightDialog } from './CancelFightDialog'
import { FightSimpleConfirmDialog } from './FightSimpleConfirmDialog'
import { SettleFightDialog } from './SettleFightDialog'

type MutPick<TData, TVars> = Pick<
  UseMutationResult<TData, Error, TVars, unknown>,
  'mutate' | 'isPending'
>

export interface FightAdminToolbarProps {
  fight: Fight
  createFight: MutPick<CreateFightResponse, void>
  closeFight: MutPick<FightActionResponse, string>
  reopenFight: MutPick<FightActionResponse, string>
  settleFight: MutPick<FightActionResponse, { id: string; body: SettleFightRequest }>
  cancelFight: MutPick<FightActionResponse, { id: string; body?: CancelFightRequest }>
  holdSide: MutPick<FightActionResponse, { id: string; side: BetSideValue }>
  unholdSide: MutPick<FightActionResponse, { id: string; side: BetSideValue }>
}

/** Large touch targets for kiosk / stressed operators. */
const CTRL = 'min-h-14 px-6 text-base font-semibold sm:min-w-[11rem]'

/** Primary betting lifecycle actions — black when enabled; disabled uses default Button opacity. */
const BETTING_CTRL = cn(CTRL)

const HOLD_MERON =
  'border-red-700 bg-red-600 text-white shadow-md hover:bg-red-700 disabled:opacity-50'
const HOLD_WALA =
  'border-blue-700 bg-blue-600 text-white shadow-md hover:bg-blue-700 disabled:opacity-50'
const UNHOLD_ACTIVE =
  'border-amber-500 bg-amber-400 font-bold text-black shadow-md hover:bg-amber-300 disabled:opacity-50'

function mutating(...m: { isPending: boolean }[]): boolean {
  return m.some((x) => x.isPending)
}

function sectionTitle(text: string) {
  return (
    <h3 className="border-b pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {text}
    </h3>
  )
}

export function FightAdminToolbar({
  fight,
  createFight,
  closeFight,
  reopenFight,
  settleFight,
  cancelFight,
  holdSide,
  unholdSide
}: FightAdminToolbarProps) {
  const [settleOutcome, setSettleOutcome] = useState<SettleFightOutcome | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [reopenConfirmOpen, setReopenConfirmOpen] = useState(false)

  const busy = mutating(
    createFight,
    closeFight,
    reopenFight,
    settleFight,
    cancelFight,
    holdSide,
    unholdSide
  )

  const onErr = (e: Error) => {
    toast.error(e instanceof ApiError ? e.message : e.message)
  }

  const canCreate = fight.status !== 'OPEN'
  const canClose = fight.status === 'OPEN'
  const canReopen = fight.status === 'CLOSED'
  const canDeclareWinner = fight.status === 'CLOSED'
  const canCancel = fight.status === 'OPEN' || fight.status === 'CLOSED'
  const canHold = fight.status === 'OPEN'

  const settleLockedTitle =
    fight.status === 'OPEN'
      ? 'Close betting first, then declare the winner here.'
      : fight.status === 'CLOSED'
        ? undefined
        : 'This fight is already finished or cancelled — open a new fight to declare a winner.'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Admin
        </span>
        <span className="rounded-md border bg-muted px-2 py-0.5 text-xs">
          {FIGHT_STATUS_LABEL[fight.status]}
        </span>
      </div>

      <div className="space-y-3">
        {sectionTitle('Betting — open & close')}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className={BETTING_CTRL}
            disabled={!canCreate || busy}
            onClick={() =>
              createFight.mutate(undefined, {
                onSuccess: () => toast.success('Fight opened'),
                onError: onErr
              })
            }
          >
            Open new fight
          </Button>
          <Button
            type="button"
            className={BETTING_CTRL}
            disabled={!canClose || busy}
            onClick={() => setCloseConfirmOpen(true)}
          >
            Close betting…
          </Button>
          <Button
            type="button"
            className={BETTING_CTRL}
            disabled={!canReopen || busy}
            onClick={() => setReopenConfirmOpen(true)}
          >
            Re-open betting…
          </Button>
          <Button
            type="button"
            className={CTRL}
            variant="destructive"
            disabled={!canCancel || busy}
            onClick={() => setCancelOpen(true)}
          >
            Cancel fight
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {sectionTitle('Side hold')}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className={cn(CTRL, HOLD_MERON)}
            disabled={!canHold || busy || fight.meronAcceptingBets === false}
            title={!canHold ? 'Only while fight is open' : undefined}
            onClick={() =>
              holdSide.mutate(
                { id: fight.id, side: BET_SIDE_VALUE.MERON },
                { onSuccess: () => toast.message(`${BET_SIDE_LABEL.MERON} held`), onError: onErr }
              )
            }
          >
            Hold {BET_SIDE_LABEL.MERON}
          </Button>
          <Button
            type="button"
            className={cn(
              CTRL,
              fight.meronAcceptingBets === false ? UNHOLD_ACTIVE : 'border-input bg-muted text-muted-foreground'
            )}
            disabled={!canHold || busy || fight.meronAcceptingBets !== false}
            title={!canHold ? 'Only while fight is open' : undefined}
            onClick={() =>
              unholdSide.mutate(
                { id: fight.id, side: BET_SIDE_VALUE.MERON },
                { onSuccess: () => toast.message(`${BET_SIDE_LABEL.MERON} live`), onError: onErr }
              )
            }
          >
            Unhold {BET_SIDE_LABEL.MERON}
          </Button>
          <Button
            type="button"
            className={cn(CTRL, HOLD_WALA)}
            disabled={!canHold || busy || fight.walaAcceptingBets === false}
            title={!canHold ? 'Only while fight is open' : undefined}
            onClick={() =>
              holdSide.mutate(
                { id: fight.id, side: BET_SIDE_VALUE.WALA },
                { onSuccess: () => toast.message(`${BET_SIDE_LABEL.WALA} held`), onError: onErr }
              )
            }
          >
            Hold {BET_SIDE_LABEL.WALA}
          </Button>
          <Button
            type="button"
            className={cn(
              CTRL,
              fight.walaAcceptingBets === false ? UNHOLD_ACTIVE : 'border-input bg-muted text-muted-foreground'
            )}
            disabled={!canHold || busy || fight.walaAcceptingBets !== false}
            title={!canHold ? 'Only while fight is open' : undefined}
            onClick={() =>
              unholdSide.mutate(
                { id: fight.id, side: BET_SIDE_VALUE.WALA },
                { onSuccess: () => toast.message(`${BET_SIDE_LABEL.WALA} live`), onError: onErr }
              )
            }
          >
            Unhold {BET_SIDE_LABEL.WALA}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {sectionTitle('Declare winner')}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className={cn(
              CTRL,
              canDeclareWinner
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-muted text-muted-foreground hover:bg-muted'
            )}
            disabled={!canDeclareWinner || busy}
            title={!canDeclareWinner ? settleLockedTitle : undefined}
            onClick={() => {
              if (!canDeclareWinner) return
              setSettleOutcome('MERON')
            }}
          >
            {BET_SIDE_LABEL.MERON} wins
          </Button>
          <Button
            type="button"
            className={cn(
              CTRL,
              canDeclareWinner
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-muted text-muted-foreground hover:bg-muted'
            )}
            disabled={!canDeclareWinner || busy}
            title={!canDeclareWinner ? settleLockedTitle : undefined}
            onClick={() => {
              if (!canDeclareWinner) return
              setSettleOutcome('WALA')
            }}
          >
            {BET_SIDE_LABEL.WALA} wins
          </Button>
          <Button
            type="button"
            className={cn(
              CTRL,
              canDeclareWinner
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-muted text-muted-foreground hover:bg-muted'
            )}
            disabled={!canDeclareWinner || busy}
            title={!canDeclareWinner ? settleLockedTitle : undefined}
            onClick={() => {
              if (!canDeclareWinner) return
              setSettleOutcome('DRAW')
            }}
          >
            Draw
          </Button>
          <Button
            type="button"
            className={cn(
              CTRL,
              canDeclareWinner
                ? ''
                : 'bg-muted text-muted-foreground hover:bg-muted border-transparent'
            )}
            variant={canDeclareWinner ? 'secondary' : 'outline'}
            disabled={!canDeclareWinner || busy}
            title={!canDeclareWinner ? settleLockedTitle : undefined}
            onClick={() => {
              if (!canDeclareWinner) return
              setSettleOutcome('NO_CONTEST')
            }}
          >
            No contest
          </Button>
        </div>
      </div>

      <FightSimpleConfirmDialog
        open={closeConfirmOpen}
        title={`Close betting on fight #${fight.fightNumber}?`}
        description="Tellers and kiosks will stop accepting new bets for this fight. You can re-open betting if that was a mistake — until a winner is declared."
        confirmLabel="Close betting"
        confirmVariant="destructive"
        isPending={closeFight.isPending}
        onClose={() => setCloseConfirmOpen(false)}
        onConfirm={() => {
          closeFight.mutate(fight.id, {
            onSuccess: () => {
              toast.success('Betting closed')
              setCloseConfirmOpen(false)
            },
            onError: (e) => {
              onErr(e)
            }
          })
        }}
      />

      <FightSimpleConfirmDialog
        open={reopenConfirmOpen}
        title={`Re-open betting on fight #${fight.fightNumber}?`}
        description="The fight returns to OPEN. Pools and tickets already placed are unchanged."
        confirmLabel="Re-open betting"
        confirmVariant="default"
        isPending={reopenFight.isPending}
        onClose={() => setReopenConfirmOpen(false)}
        onConfirm={() => {
          reopenFight.mutate(fight.id, {
            onSuccess: () => {
              toast.success('Betting re-opened')
              setReopenConfirmOpen(false)
            },
            onError: (e) => {
              onErr(e)
            }
          })
        }}
      />

      <SettleFightDialog
        fightNumber={fight.fightNumber}
        outcome={settleOutcome}
        isPending={settleFight.isPending}
        onClose={() => setSettleOutcome(null)}
        onConfirm={() => {
          if (!settleOutcome) return
          settleFight.mutate(
            { id: fight.id, body: { outcome: settleOutcome } },
            {
              onSuccess: () => {
                toast.success('Fight settled')
                setSettleOutcome(null)
              },
              onError: onErr
            }
          )
        }}
      />

      <CancelFightDialog
        open={cancelOpen}
        fightNumber={fight.fightNumber}
        isPending={cancelFight.isPending}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => {
          cancelFight.mutate(
            { id: fight.id, body: reason ? { reason } : {} },
            {
              onSuccess: () => {
                toast.success('Fight cancelled')
                setCancelOpen(false)
              },
              onError: onErr
            }
          )
        }}
      />
    </div>
  )
}
