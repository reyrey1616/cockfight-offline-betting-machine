/** Set by Electron preload from `config.json` on each kiosk PC. */
export interface KioskConfig {
  apiBaseUrl: string | null
}

/** Full slip document — same HTML as browser `window.print()` (`buildBetTicketSlipHtml`). */
export interface BetTicketPrintPayload {
  html: string
}

export interface BetTicketPrintResult {
  ok: boolean
  error?: string
}

/** Full collector badge document — same HTML as browser `window.print()`. */
export interface CollectorBadgePrintPayload {
  html: string
}

export type CollectorBadgePrintResult = BetTicketPrintResult

/** Full cash slip document — same HTML as browser `window.print()`. */
export interface CashSlipPrintPayload {
  html: string
}

export type CashSlipPrintResult = BetTicketPrintResult

/** Full payout receipt document — same HTML as browser `window.print()`. */
export interface PayoutReceiptPrintPayload {
  html: string
}

export type PayoutReceiptPrintResult = BetTicketPrintResult

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
  printPayoutReceipt: (payload: PayoutReceiptPrintPayload) => Promise<PayoutReceiptPrintResult>
  getDesktopConfig: () => Promise<DesktopConfigSummary>
  /** Fired when background bet slip print fails (IPC returns before print finishes). */
  onBetTicketPrintFailed?: (callback: (message: string) => void) => void
}

declare global {
  interface Window {
    kioskConfig?: KioskConfig
    electronAPI?: ElectronAPI
  }
}

export {}
