import { contextBridge, ipcRenderer } from 'electron'

/** Populated async from main — avoids importing main-process `app` in preload (breaks on some Windows builds). */
let kioskApiBaseUrl = ''

contextBridge.exposeInMainWorld('kioskConfig', {
  get apiBaseUrl() {
    return kioskApiBaseUrl || null
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printBetTicket: (payload) => ipcRenderer.invoke('print-bet-ticket', payload),
  printCollectorBadge: (payload) => ipcRenderer.invoke('print-collector-badge', payload),
  printCashSlip: (payload) => ipcRenderer.invoke('print-cash-slip', payload),
  printPayoutReceipt: (payload) => ipcRenderer.invoke('print-payout-receipt', payload),
  getDesktopConfig: () => ipcRenderer.invoke('get-desktop-config'),
  onBetTicketPrintFailed: (callback) => {
    if (typeof callback !== 'function') return
    ipcRenderer.on('bet-ticket-print-failed', (_event, message) => {
      callback(typeof message === 'string' ? message : 'Print failed')
    })
  }
})

void ipcRenderer.invoke('get-kiosk-config').then((cfg) => {
  kioskApiBaseUrl = cfg?.apiBaseUrl?.trim() || ''
})
