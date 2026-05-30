/** Set by Electron preload from `config.json` on each kiosk PC. */
export interface KioskConfig {
  apiBaseUrl: string | null
}

/** Payload for 80mm thermal bet slip (Electron main process). */
export interface BetTicketPrintPayload {
  code: string
  amount: string
  tellerName: string
  barcodePngDataUrl: string
}

export interface BetTicketPrintResult {
  ok: boolean
  error?: string
}

/** Payload for 80mm thermal collector badge (Electron main process). */
export interface CollectorBadgePrintPayload {
  name: string
  code: string
  barcodePngDataUrl: string
}

export type CollectorBadgePrintResult = BetTicketPrintResult

export interface DesktopConfigSummary {
  apiBaseUrl: string
  silentPrint: boolean
  printerName: string
}

export interface ElectronAPI {
  isElectron: true
  printBetTicket: (payload: BetTicketPrintPayload) => Promise<BetTicketPrintResult>
  printCollectorBadge: (payload: CollectorBadgePrintPayload) => Promise<CollectorBadgePrintResult>
  getDesktopConfig: () => Promise<DesktopConfigSummary>
}

declare global {
  interface Window {
    kioskConfig?: KioskConfig
    electronAPI?: ElectronAPI
  }
}

export {}
