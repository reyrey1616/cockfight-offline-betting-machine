import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/format-money'
import {
  fightBoardHistoryViewportHeight,
  formatBoardOdds,
  formatFightLabel,
  type FightBoardHistoryRow,
  type FightBoardSessionStats
} from '@/lib/fight-board-derive'
import type { FightStatusValue } from '@/constants'

export interface FightBoardLayoutProps {
  meronPool: string
  walaPool: string
  meronOdds: number | null
  walaOdds: number | null
  /** While fight is open, admin may pause new bets on this side (API: *AcceptingBets=false). */
  meronSideHeld?: boolean
  walaSideHeld?: boolean
  fightNumber: number | null
  fightStatus: FightStatusValue | null
  sessionStats: FightBoardSessionStats
  history: FightBoardHistoryRow[]
  tickerMessage: string
  /** embedded = rounded card; fullscreen = edge-to-edge TV */
  variant?: 'embedded' | 'fullscreen'
}

function statusPillClass(status: FightStatusValue | null): string {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-zinc-400 text-black font-bold'
    case 'OPEN':
      return 'bg-lime-400 text-black font-black shadow-[0_0_20px_rgba(163,230,53,0.5)]'
    case 'LAST_CALL':
      return 'bg-amber-400 text-black font-black shadow-[0_0_20px_rgba(251,191,36,0.6)]'
    case 'CLOSED':
      return 'bg-amber-400 text-black font-bold'
    case 'SETTLED':
      return 'bg-sky-500 text-white font-bold'
    case 'CANCELLED':
      return 'bg-zinc-500 text-white font-bold'
    default:
      return 'bg-zinc-600 text-white font-bold'
  }
}

function statusPillLabel(status: FightStatusValue | null): string {
  if (!status) return '—'
  return status.charAt(0) + status.slice(1).toLowerCase()
}

/** One-line context driven by admin fight lifecycle (matches ticker semantics). */
function statusContextLine(
  status: FightStatusValue | null,
  meronHeld: boolean,
  walaHeld: boolean
): string | null {
  if (status === 'OPEN' || status === 'LAST_CALL') {
    if (meronHeld && walaHeld) return 'Both sides held — admin paused all new bets.'
    if (meronHeld) return 'Meron held — only Wala tickets until admin releases Meron.'
    if (walaHeld) return 'Wala held — only Meron tickets until admin releases Wala.'
    return status === 'LAST_CALL'
      ? 'Last call — betting is still open but may close any time.'
      : 'Fight open — pools and odds update with each bet.'
  }
  if (status === 'CLOSED') return 'Betting closed — pools locked until admin settles.'
  if (status === 'SETTLED') return 'Settled — board shows final pools / odds snapshot.'
  if (status === 'CANCELLED') return 'Cancelled — pending bets refunded per house rules.'
  if (status === 'SCHEDULED') return 'Scheduled — admin will open when ready.'
  return null
}

/** Bottom ticker strip — green only while betting is open; red when closed or no fight. */
function tickerBarClasses(status: FightStatusValue | null): { bar: string; text: string } {
  switch (status) {
    case 'SCHEDULED':
      return {
        bar: 'border-t-4 border-zinc-600 bg-zinc-700',
        text: 'text-zinc-100'
      }
    case 'OPEN':
      return {
        bar: 'border-t-4 border-lime-400 bg-lime-500',
        text: 'text-black'
      }
    case 'LAST_CALL':
      return {
        bar: 'border-t-4 border-amber-700 bg-amber-500',
        text: 'text-black'
      }
    case 'CLOSED':
      return {
        bar: 'border-t-4 border-red-800 bg-red-600',
        text: 'text-white'
      }
    case 'SETTLED':
      return {
        bar: 'border-t-4 border-sky-600 bg-sky-500',
        text: 'text-white'
      }
    case 'CANCELLED':
      return {
        bar: 'border-t-4 border-zinc-600 bg-zinc-700',
        text: 'text-white'
      }
    default:
      return {
        bar: 'border-t-4 border-red-900 bg-red-800',
        text: 'text-white'
      }
  }
}

function historyRowClass(result: FightBoardHistoryRow['result']): string {
  switch (result) {
    case 'MERON':
      return 'bg-red-600 text-white'
    case 'WALA':
      return 'bg-blue-600 text-white'
    case 'DRAW':
      return 'bg-emerald-600 text-white'
    case 'CANCELLED':
      return 'bg-zinc-600 text-white'
    default:
      return 'bg-zinc-700 text-white'
  }
}

function sideOddsDisplay(
  odds: number | null,
  sideHeld: boolean,
  heldLabel: 'MERON' | 'WALA',
  bettingOpen: boolean,
  fightSettled: boolean
): ReactNode {
  const oddsText = formatBoardOdds(odds)
  const oddsClass = cn(
    'font-black tabular-nums tracking-tight text-black',
    bettingOpen ? 'text-4xl lg:text-5xl' : 'text-3xl text-zinc-800 lg:text-4xl'
  )
  if (sideHeld) {
    return (
      <div className="space-y-2">
        <p className="text-3xl font-black uppercase tracking-tight text-amber-600 lg:text-4xl">
          Held
        </p>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          No new {heldLabel} bets (admin)
        </p>
        {odds != null ? (
          <p className={cn(oddsClass, 'text-zinc-600')}>{oddsText}</p>
        ) : null}
      </div>
    )
  }
  return (
    <div className="space-y-1">
      <p className={oddsClass}>{oddsText}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
        {bettingOpen ? 'Payout ×' : fightSettled ? 'Final payout ×' : 'Last odds'}
      </p>
    </div>
  )
}

/**
 * High-contrast sabong-style board: Meron | results | Wala + bottom ticker.
 * Presentational only — data comes from `fight-board-derive` + live fight state.
 */
export function FightBoardLayout({
  meronPool,
  walaPool,
  meronOdds,
  walaOdds,
  meronSideHeld = false,
  walaSideHeld = false,
  fightNumber,
  fightStatus,
  sessionStats,
  history,
  tickerMessage,
  variant = 'embedded'
}: FightBoardLayoutProps) {
  const full = variant === 'fullscreen'
  const tickerSkin = tickerBarClasses(fightStatus)
  const bettingOpen = fightStatus === 'OPEN' || fightStatus === 'LAST_CALL'
  const fightSettled = fightStatus === 'SETTLED'
  const contextLine = statusContextLine(fightStatus, meronSideHeld, walaSideHeld)

  return (
    <div
      className={cn(
        'flex flex-col bg-zinc-950 text-white',
        full ? 'min-h-dvh' : 'min-h-[420px] overflow-hidden rounded-xl border border-zinc-800 shadow-xl'
      )}
    >
      <div className="grid flex-1 grid-cols-1 gap-0 lg:grid-cols-[1fr_minmax(220px,320px)_1fr]">
        {/* Meron column */}
        <div className="flex min-h-[280px] flex-col border-b border-zinc-800 lg:border-b-0 lg:border-r">
          <div className="bg-red-600 py-4 text-center text-2xl font-black tracking-widest text-white lg:text-3xl">
            MERON
          </div>
          {bettingOpen && meronSideHeld ? (
            <div
              className="py-2 text-center text-xs font-black uppercase tracking-wider text-black"
              style={{
                background:
                  'repeating-linear-gradient(-45deg, #fbbf24, #fbbf24 10px, #171717 10px, #171717 20px)'
              }}
            >
              Side held — Meron bets paused
            </div>
          ) : null}
          <div
            className={cn(
              'flex flex-1 flex-col bg-zinc-200 text-zinc-900',
              !bettingOpen && 'opacity-90'
            )}
          >
            <div className="border-b border-zinc-300 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-zinc-600">
              Total bets
            </div>
            <div className="flex flex-1 flex-col items-center justify-center px-2 py-6">
              <p className="text-4xl font-black tabular-nums tracking-tight lg:text-5xl">
                {formatMoney(meronPool)}
              </p>
              <div
                className={cn(
                  'mt-6 w-full max-w-[280px] bg-white px-4 py-6 text-center shadow-inner',
                  bettingOpen && meronSideHeld && 'ring-4 ring-amber-500 ring-inset'
                )}
              >
                {sideOddsDisplay(meronOdds, meronSideHeld, 'MERON', bettingOpen, fightSettled)}
              </div>
            </div>
          </div>
          <div className="border-t border-red-900 bg-red-800 py-2 text-center text-sm font-bold uppercase tracking-widest text-white">
            Payout
          </div>
        </div>

        {/* Center — session + current + history */}
        <div className="flex min-h-[260px] flex-col border-b border-zinc-800 bg-zinc-900 lg:border-b-0 lg:border-r">
          <div
            className="py-3 text-center text-lg font-black uppercase tracking-wider text-black"
            style={{
              background:
                'repeating-linear-gradient(-45deg, #facc15, #facc15 12px, #171717 12px, #171717 24px)'
            }}
          >
            Results
          </div>

          <div className="grid grid-cols-3 gap-2 p-3">
            <div className="rounded border border-red-800/60 bg-red-950/80 py-3 text-center">
              <div className="text-[10px] font-bold uppercase text-red-200">Meron</div>
              <div className="text-3xl font-black tabular-nums text-red-100">
                {sessionStats.meronWins}
              </div>
            </div>
            <div className="rounded border border-emerald-800/60 bg-emerald-950/80 py-3 text-center">
              <div className="text-[10px] font-bold uppercase text-emerald-200">Draw</div>
              <div className="text-3xl font-black tabular-nums text-emerald-100">
                {sessionStats.draws}
              </div>
            </div>
            <div className="rounded border border-blue-800/60 bg-blue-950/80 py-3 text-center">
              <div className="text-[10px] font-bold uppercase text-blue-200">Wala</div>
              <div className="text-3xl font-black tabular-nums text-blue-100">
                {sessionStats.walaWins}
              </div>
            </div>
          </div>

          <div className="mx-3 mb-2 rounded border border-zinc-700 bg-zinc-800/80 py-2 text-center">
            <div className="text-[10px] font-bold uppercase text-zinc-400">Canceled</div>
            <div className="text-xl font-black tabular-nums text-zinc-100">
              {sessionStats.cancelled}
            </div>
          </div>

          <div className="mx-3 mb-2 flex items-center justify-center gap-3 rounded-lg border-2 border-zinc-600 bg-black/40 py-3">
            <span className="text-4xl font-black tabular-nums text-white">
              {formatFightLabel(fightNumber)}
            </span>
            <span
              className={cn(
                'rounded-md px-4 py-1.5 text-sm uppercase tracking-wide',
                statusPillClass(fightStatus)
              )}
            >
              {statusPillLabel(fightStatus)}
            </span>
          </div>

          {contextLine ? (
            <p className="mx-3 mb-2 rounded-md border border-zinc-600 bg-zinc-950/60 px-3 py-2 text-center text-[11px] font-semibold leading-snug tracking-wide text-zinc-200">
              {contextLine}
            </p>
          ) : null}

          {bettingOpen && (meronSideHeld || walaSideHeld) ? (
            <div className="mx-3 mb-2 rounded-md border border-amber-600 bg-amber-950/80 px-3 py-2 text-center text-[11px] font-black uppercase leading-snug tracking-wide text-amber-100">
              {meronSideHeld && walaSideHeld
                ? 'Both sides held — no new bets'
                : meronSideHeld
                  ? 'Meron held — no new Meron bets'
                  : 'Wala held — no new Wala bets'}
            </div>
          ) : null}

          <div
            className="flex shrink-0 flex-col gap-1 overflow-y-auto overscroll-contain px-3 pb-3"
            style={{
              minHeight: fightBoardHistoryViewportHeight(),
              maxHeight: fightBoardHistoryViewportHeight()
            }}
          >
            {history.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-500">No finished fights in view.</p>
            ) : (
              history.map((row) => (
                <div
                  key={row.fightNumber}
                  className="flex items-center justify-between rounded px-3 py-2 text-sm font-bold"
                >
                  <span className="min-w-[2.5rem] tabular-nums text-zinc-300">
                    {formatFightLabel(row.fightNumber)}
                  </span>
                  <span
                    className={cn(
                      'min-w-[4.5rem] rounded px-3 py-1 text-center text-xs uppercase',
                      historyRowClass(row.result)
                    )}
                  >
                    {row.result}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Wala column */}
        <div className="flex min-h-[280px] flex-col">
          <div className="bg-blue-600 py-4 text-center text-2xl font-black tracking-widest text-white lg:text-3xl">
            WALA
          </div>
          {bettingOpen && walaSideHeld ? (
            <div
              className="py-2 text-center text-xs font-black uppercase tracking-wider text-black"
              style={{
                background:
                  'repeating-linear-gradient(-45deg, #fbbf24, #fbbf24 10px, #171717 10px, #171717 20px)'
              }}
            >
              Side held — Wala bets paused
            </div>
          ) : null}
          <div
            className={cn(
              'flex flex-1 flex-col bg-zinc-200 text-zinc-900',
              !bettingOpen && 'opacity-90'
            )}
          >
            <div className="border-b border-zinc-300 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-zinc-600">
              Total bets
            </div>
            <div className="flex flex-1 flex-col items-center justify-center px-2 py-6">
              <p className="text-4xl font-black tabular-nums tracking-tight lg:text-5xl">
                {formatMoney(walaPool)}
              </p>
              <div
                className={cn(
                  'mt-6 w-full max-w-[280px] bg-white px-4 py-6 text-center shadow-inner',
                  bettingOpen && walaSideHeld && 'ring-4 ring-amber-500 ring-inset'
                )}
              >
                {sideOddsDisplay(walaOdds, walaSideHeld, 'WALA', bettingOpen, fightSettled)}
              </div>
            </div>
          </div>
          <div className="border-t border-blue-900 bg-blue-800 py-2 text-center text-sm font-bold uppercase tracking-widest text-white">
            Payout
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className={cn('shrink-0 py-3 text-center', tickerSkin.bar)}>
        <p
          className={cn(
            'px-4 text-sm font-black uppercase tracking-wide lg:text-base',
            tickerSkin.text
          )}
        >
          {tickerMessage}
        </p>
      </div>
    </div>
  )
}
