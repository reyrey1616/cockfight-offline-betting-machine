import { FIGHT_OUTCOME_LABEL } from '@/constants'
import { cn } from '@/lib/utils'

import type { FightWinnerFlash } from '@/hooks/useFightWinnerFlash'

export interface FightWinnerOverlayProps {
  flash: FightWinnerFlash | null
}

const PANEL_CLASS: Record<FightWinnerFlash['outcome'], string> = {
  MERON: 'border-red-500 bg-gradient-to-b from-red-600 to-red-900 text-white',
  WALA: 'border-sky-400 bg-gradient-to-b from-blue-600 to-blue-950 text-white',
  DRAW: 'border-emerald-400 bg-gradient-to-b from-emerald-600 to-emerald-950 text-white',
  CANCELLED: 'border-zinc-400 bg-gradient-to-b from-zinc-600 to-zinc-900 text-white'
}

/**
 * Full-screen fight result — auto-dismissed by the parent hook only
 * (no manual dismiss).
 */
export function FightWinnerOverlay({ flash }: FightWinnerOverlayProps) {
  if (!flash) return null

  const headline =
    flash.outcome === 'CANCELLED' ? 'Fight cancelled' : 'Official result'
  const title =
    flash.outcome === 'CANCELLED'
      ? 'Cancelled'
      : flash.outcome === 'DRAW'
        ? 'Draw'
        : flash.outcome

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="fight-winner-title"
      aria-live="assertive"
    >
      <div
        className={cn(
          'max-w-[min(96vw,520px)] rounded-2xl border-4 px-8 py-10 text-center shadow-2xl',
          PANEL_CLASS[flash.outcome]
        )}
      >
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/90">
          {headline}
        </p>
        <h2
          id="fight-winner-title"
          className="mt-3 text-5xl font-black uppercase tracking-widest sm:text-6xl md:text-7xl"
        >
          {title}
        </h2>
        <p className="mt-3 text-base font-semibold text-white/90 sm:text-lg">
          {FIGHT_OUTCOME_LABEL[flash.outcome]}
        </p>
        <p className="mt-4 text-lg font-semibold tabular-nums text-white/95 sm:text-xl">
          Fight #{flash.fightNumber}
        </p>
      </div>
    </div>
  )
}
