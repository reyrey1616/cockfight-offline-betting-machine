import { cn } from '@/lib/utils'

/** Short date + time for dense report tables. */
export function fmtWhenShort(iso: string): string {
  try {
    const d = new Date(iso)
    const date = d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    return `${date} ${time}`
  } catch {
    return iso
  }
}

/** Shared layout tokens for dashboard cards (compact). */
export const dash = {
  card: (extra?: string) => cn('overflow-hidden border shadow-sm', extra),
  header: 'flex flex-row items-center justify-between gap-2 px-3 py-2',
  title: 'text-sm font-semibold leading-tight tracking-tight',
  liveBadge:
    'shrink-0 rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground',
  /** Fixed-height viewport: only this region scrolls (taller on large / tall viewports). */
  bodyScroll: 'h-[clamp(260px,48dvh,28rem)] overflow-y-auto overflow-x-auto',
  table: 'w-full text-left text-xs',
  thead: 'sticky top-0 z-[1] bg-card/95 text-[10px] uppercase tracking-wide text-muted-foreground backdrop-blur-sm',
  th: 'px-2 py-1.5 font-semibold',
  td: 'px-2 py-1 align-top',
  tdNum: 'px-2 py-1 tabular-nums align-top',
  row: 'border-b border-border/50 last:border-0',
  empty: 'px-2 py-8 text-center text-[11px] text-muted-foreground',
  /** Totals row below the scrollable table body. */
  summaryBar:
    'shrink-0 border-t border-border/80 bg-muted/30 px-2 py-1.5 text-[10px] font-semibold tabular-nums'
} as const
