import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { app, nativeImage } from 'electron'

const execFileAsync = promisify(execFile)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const THERMAL_PS1 = path.join(__dirname, 'print-png-thermal.ps1')

/** PowerShell cannot read scripts inside app.asar — use the unpacked copy in production builds. */
function resolveThermalPs1Path() {
  if (!app.isPackaged) {
    return THERMAL_PS1
  }

  const candidates = [
    THERMAL_PS1.replace(`${path.sep}app.asar${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`),
    path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'print-png-thermal.ps1')
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return THERMAL_PS1
}

export const THERMAL_DPI = 203
/** Physical roll — printable area is slightly narrower (right edge clips if we use full 80mm). */
export const THERMAL_ROLL_WIDTH_MM = 80
/** Safe content width on XP-80 / XPrinter (~72mm printable on 80mm roll). */
export const THERMAL_SLIP_WIDTH_MM = 72
/** Max slip height — content is usually shorter; bitmap height follows capture. */
export const THERMAL_SLIP_HEIGHT_MM = 54

/** Slip width in dots @ 203dpi — matches CSS layout, not the full 80mm roll. */
export const THERMAL_PRINTABLE_DOTS = Math.round((THERMAL_SLIP_WIDTH_MM / 25.4) * THERMAL_DPI)

/** Screen CSS pixels for slip layout at 96dpi. */
export function thermalLayoutWidthPx() {
  return Math.round((THERMAL_SLIP_WIDTH_MM / 25.4) * 96)
}

/** Screen CSS pixels for slip height at 96dpi. */
export function thermalLayoutHeightPx(heightMm = THERMAL_SLIP_HEIGHT_MM) {
  return Math.round((heightMm / 25.4) * 96)
}

export function thermalWidthDots() {
  return THERMAL_PRINTABLE_DOTS
}

export function thermalHeightDots(heightMm = THERMAL_SLIP_HEIGHT_MM) {
  return Math.round((heightMm / 25.4) * THERMAL_DPI)
}

/** CSS layout px → mm (96dpi screen layout). */
export function cssPxToMm(cssPx) {
  return (cssPx / 96) * 25.4
}

/** Capture scale from 96dpi CSS layout to 203dpi bitmap. */
export const THERMAL_CAPTURE_SCALE = THERMAL_DPI / 96

function mspaintPath() {
  return path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'mspaint.exe')
}

/**
 * Scale to printer width; height follows `.slip` layout (capped at THERMAL_SLIP_HEIGHT_MM).
 *
 * @param {Buffer} pngBuffer
 * @param {number} [layoutHeightCssPx] — `.slip` height from getBoundingClientRect
 */
export function normalizeThermalPng(pngBuffer, layoutHeightCssPx = 0) {
  const image = nativeImage.createFromBuffer(pngBuffer)
  const targetWidth = thermalWidthDots()
  const capturedMm =
    layoutHeightCssPx > 0
      ? Math.min(THERMAL_SLIP_HEIGHT_MM, cssPxToMm(layoutHeightCssPx))
      : THERMAL_SLIP_HEIGHT_MM
  const targetHeight = thermalHeightDots(capturedMm)
  const size = image.getSize()

  if (size.width === targetWidth && size.height === targetHeight) {
    return { buffer: pngBuffer, width: targetWidth, height: targetHeight, heightMm: capturedMm }
  }

  const resized = image.resize({ width: targetWidth, height: targetHeight, quality: 'best' })
  return {
    buffer: resized.toPNG(),
    width: targetWidth,
    height: targetHeight,
    heightMm: capturedMm
  }
}

function windowsPowerShellExe() {
  return path.join(
    process.env.SystemRoot || 'C:\\Windows',
    'System32',
    'WindowsPowerShell',
    'v1.0',
    'powershell.exe'
  )
}

async function printPngWithPowerShell(pngPath, printerName) {
  const ps1Path = resolveThermalPs1Path()
  if (!fs.existsSync(ps1Path)) {
    throw new Error(`Missing thermal print script: ${ps1Path}`)
  }

  const psExe = windowsPowerShellExe()
  if (!fs.existsSync(psExe)) {
    throw new Error(`Windows PowerShell not found: ${psExe}`)
  }

  await execFileAsync(
    psExe,
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      ps1Path,
      '-PngPath',
      pngPath,
      '-PrinterName',
      printerName,
      '-Dpi',
      String(THERMAL_DPI)
    ],
    { windowsHide: true, timeout: 45_000 }
  )
}

/** Last-resort fallback — mspaint often shrinks on thermal drivers. */
async function printPngWithMsPaint(pngPath, printerName, widthPx, heightPx) {
  if (!fs.existsSync(mspaintPath())) {
    throw new Error('mspaint.exe not found')
  }

  const args = ['/pt', pngPath]
  if (printerName?.trim()) {
    args.push(printerName.trim())
  }
  if (widthPx > 0 && heightPx > 0) {
    args.push(String(Math.round(widthPx)), String(Math.round(heightPx)))
  }

  await execFileAsync(mspaintPath(), args, { windowsHide: true, timeout: 30_000 })
}

/**
 * Silent bitmap print on Windows — .NET PrintDocument fills the printable area.
 *
 * @param {string} pngPath
 * @param {string} printerName
 * @param {number} widthPx
 * @param {number} heightPx
 */
export async function printPngSilentlyOnWindows(pngPath, printerName, widthPx, heightPx) {
  if (process.platform !== 'win32') {
    throw new Error('printPngSilentlyOnWindows is Windows-only')
  }
  if (!fs.existsSync(pngPath)) {
    throw new Error(`PNG not found: ${pngPath}`)
  }

  const trimmed = printerName?.trim()
  if (!trimmed) {
    throw new Error('Printer name is required for silent thermal print')
  }

  try {
    await printPngWithPowerShell(pngPath, trimmed)
    return 'powershell'
  } catch (psErr) {
    console.warn('[print-png-windows] PowerShell thermal print failed, trying mspaint', psErr)
    await printPngWithMsPaint(pngPath, trimmed, widthPx, heightPx)
    return 'mspaint'
  }
}
