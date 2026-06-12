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
  recordedAt: string
  notes?: string
  barcodePngDataUrl: string
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
