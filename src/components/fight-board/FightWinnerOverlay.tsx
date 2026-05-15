import { cn } from '@/lib/utils'

import type { FightWinnerFlash } from '@/hooks/useFightWinnerFlash'

export interface FightWinnerOverlayProps {
  flash: FightWinnerFlash | null
}

/**
 * Full-screen MERON/WALA result — auto-dismissed by the parent hook only
 * (no manual dismiss).
 */
export function FightWinnerOverlay({ flash }: FightWinnerOverlayProps) {
  if (!flash) return null

  const meron = flash.winner === 'MERON'

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
          meron
            ? 'border-red-500 bg-gradient-to-b from-red-600 to-red-900 text-white'
            : 'border-sky-400 bg-gradient-to-b from-blue-600 to-blue-950 text-white'
        )}
      >
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-white/90">
          Official result
        </p>
        <h2
          id="fight-winner-title"
          className="mt-3 text-5xl font-black uppercase tracking-widest sm:text-6xl md:text-7xl"
        >
          {flash.winner}
        </h2>
        <p className="mt-4 text-lg font-semibold tabular-nums text-white/95 sm:text-xl">
          Fight #{flash.fightNumber}
        </p>
      </div>
    </div>
  )
}
