import { contextBridge, ipcRenderer } from 'electron'

import { loadDesktopConfig } from './config.mjs'

const config = loadDesktopConfig()
const apiBaseUrl = config.apiBaseUrl?.trim() || null

contextBridge.exposeInMainWorld('kioskConfig', {
  apiBaseUrl
})

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  printBetTicket: (payload) => ipcRenderer.invoke('print-bet-ticket', payload),
  printCollectorBadge: (payload) => ipcRenderer.invoke('print-collector-badge', payload),
  printCashSlip: (payload) => ipcRenderer.invoke('print-cash-slip', payload),
  printPayoutReceipt: (payload) => ipcRenderer.invoke('print-payout-receipt', payload),
  getDesktopConfig: () => ipcRenderer.invoke('get-desktop-config')
})
