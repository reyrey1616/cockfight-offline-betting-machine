import { isPrinterOffline, resolvePrinterFromList } from '../shared/printer-resolve.mjs'

export { THERMAL_PRINTER_RE, VIRTUAL_PRINTER_RE } from '../shared/printer-resolve.mjs'

export async function resolvePrinterName(webContents, configuredName) {
  try {
    const printers = await webContents.getPrintersAsync()
    const name = resolvePrinterFromList(printers, configuredName)
    if (name) {
      const picked = printers.find((p) => p.name === name)
      console.log('[print-html-slip] printer resolved', {
        name,
        configured: configuredName?.trim() || '(auto)',
        isDefault: picked?.isDefault ?? false,
        offline: picked ? isPrinterOffline(picked) : undefined
      })
    }
    return name
  } catch (err) {
    console.warn('[print-html-slip] getPrintersAsync failed', err)
    return configuredName?.trim() ?? ''
  }
}
