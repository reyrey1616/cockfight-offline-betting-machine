import { cn } from '@/lib/utils'

/**
 * Styles for native `<dialog>` used with `showModal()`.
 * Browsers do not reliably center in app layouts; `fixed` + translate pins to viewport middle.
 */
export function nativeModalDialogClassName() {
  return cn(
    'fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto',
    'rounded-lg border bg-background p-0 text-foreground shadow-lg',
    'backdrop:bg-black/50'
  )
}
