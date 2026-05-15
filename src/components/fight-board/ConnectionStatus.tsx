import type { WsConnectionStatus } from '@/hooks/useFightLiveState'

const LABEL: Record<WsConnectionStatus, string> = {
  idle: 'Offline',
  connecting: 'Connecting…',
  open: 'Live',
  reconnecting: 'Reconnecting…',
  closed: 'Disconnected',
  auth_error: 'Auth failed'
}

const TONE: Record<WsConnectionStatus, string> = {
  idle: 'bg-muted text-muted-foreground',
  connecting: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  open: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  reconnecting: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  closed: 'bg-muted text-muted-foreground',
  auth_error: 'bg-destructive/15 text-destructive'
}

export interface ConnectionStatusProps {
  status: WsConnectionStatus
  lastError: string | null
  /** Use `dark` on zinc/black bars (TV header). */
  surface?: 'default' | 'dark'
}

export function ConnectionStatus({
  status,
  lastError,
  surface = 'default'
}: ConnectionStatusProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[status]}`}
      >
        {LABEL[status]}
      </span>
      {lastError && status !== 'open' ? (
        <span
          className={
            surface === 'dark' ? 'text-xs text-zinc-400' : 'text-xs text-muted-foreground'
          }
        >
          {lastError}
        </span>
      ) : null}
    </div>
  )
}
