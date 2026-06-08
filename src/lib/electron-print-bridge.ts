/** True when running inside the Electron kiosk shell (preload exposed IPC). */
export function hasElectronPrintBridge(): boolean {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true
}

/** True when Chromium is Electron even if preload failed to attach. */
export function isElectronUserAgent(): boolean {
  return typeof navigator !== 'undefined' && /Electron\//i.test(navigator.userAgent)
}

/**
 * Browser popup print — only for local web dev without Electron.
 * In the packaged kiosk this path shows the system print dialog (not silent).
 */
export function warnIfBrowserPrintFallback(): void {
  if (hasElectronPrintBridge()) return
  if (isElectronUserAgent()) {
    console.error(
      '[FMJ Kiosk] Electron print bridge missing — slips will open a print dialog. Reinstall the kiosk app or restart Electron.'
    )
    return
  }
  console.warn(
    '[FMJ Kiosk] Not running in Electron — use the installed kiosk app (or npm run dev:electron) for silent thermal printing.'
  )
}
