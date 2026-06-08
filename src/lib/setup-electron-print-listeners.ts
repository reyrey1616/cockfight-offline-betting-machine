import { toast } from 'sonner'

/** Surface background bet-slip print failures from the Electron main process. */
export function setupElectronPrintListeners(): void {
  window.electronAPI?.onBetTicketPrintFailed?.((message) => {
    toast.error(`Ticket print failed: ${message}`)
  })
}
