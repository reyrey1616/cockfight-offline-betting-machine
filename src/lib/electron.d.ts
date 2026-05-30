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

export interface CashSlipPrintPayload {
  kind: 'deposit' | 'remit'
  code: string
  amount: string
  collectorName: string
  tellerName: string
  notes?: string
  barcodePngDataUrl: string
}

export type CashSlipPrintResult = BetTicketPrintResult

export interface DesktopConfigSummary {
  apiBaseUrl: string
  silentPrint: boolean
  printerName: string
}

export interface ElectronAPI {
  isElectron: true
  printBetTicket: (payload: BetTicketPrintPayload) => Promise<BetTicketPrintResult>
  printCollectorBadge: (payload: CollectorBadgePrintPayload) => Promise<CollectorBadgePrintResult>
  printCashSlip: (payload: CashSlipPrintPayload) => Promise<CashSlipPrintResult>
  getDesktopConfig: () => Promise<DesktopConfigSummary>
}

declare global {
  interface Window {
    kioskConfig?: KioskConfig
    electronAPI?: ElectronAPI
  }
}

export {}
