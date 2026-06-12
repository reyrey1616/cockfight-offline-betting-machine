export const VIRTUAL_PRINTER_RE = /pdf|xps|one note|onenote|fax|send to|microsoft print/i
export const THERMAL_PRINTER_RE = /xp[- ]?[k80]|xprinter|thermal|pos|receipt|80mm/i

/** Win32 PRINTER_STATUS_* bits exposed on Electron `PrinterInfo.status`. */
const STATUS_OFFLINE = 0x80
const STATUS_ERROR = 0x02

export function isPrinterOffline(printer) {
  if (!printer || typeof printer.status !== 'number') return false
  return (printer.status & STATUS_OFFLINE) !== 0 || (printer.status & STATUS_ERROR) !== 0
}

function isPhysical(printer) {
  return !VIRTUAL_PRINTER_RE.test(printer.name)
}

function isThermal(printer) {
  return THERMAL_PRINTER_RE.test(printer.name)
}

/**
 * Pick a printer for silent print.
 * Honors `config.printerName`, then Windows default (same as `window.print()`),
 * then the first online thermal — never the first thermal in list order alone.
 */
export function resolvePrinterFromList(printers, configuredName) {
  const trimmed = configuredName?.trim()
  if (trimmed) return trimmed

  if (!printers?.length) return ''

  const physical = printers.filter(isPhysical)

  const defaultPhysical = physical.find((p) => p.isDefault)
  if (defaultPhysical) {
    return defaultPhysical.name
  }

  const onlineThermal = physical.find((p) => isThermal(p) && !isPrinterOffline(p))
  if (onlineThermal) return onlineThermal.name

  const anyThermal = physical.find(isThermal)
  if (anyThermal) return anyThermal.name

  if (physical[0]) return physical[0].name

  const defaultAny = printers.find((p) => p.isDefault)
  return defaultAny?.name ?? printers[0]?.name ?? ''
}
