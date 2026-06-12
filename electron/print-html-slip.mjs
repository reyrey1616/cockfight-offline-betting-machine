import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'

import { BrowserWindow } from 'electron'

import {
  normalizeThermalPng,
  printPngSilentlyOnWindows,
  THERMAL_CAPTURE_SCALE,
  THERMAL_SLIP_WIDTH_MM,
  thermalHeightDots,
  thermalLayoutHeightPx,
  thermalLayoutWidthPx,
  thermalWidthDots
} from './print-png-windows.mjs'
import { resolvePrinterName, THERMAL_PRINTER_RE } from './printer-resolve.mjs'

const SILENT_PRINT_TIMEOUT_MS = 20_000
/** Interactive print — user must confirm in the system dialog. */
const INTERACTIVE_PRINT_TIMEOUT_MS = 120_000
/** Let layout + barcode image settle before measuring the slip. */
const SILENT_PRINT_SETTLE_MS = 1_200
/** Tiny capture bleed for anti-aliased borders — paper height still uses `.slip` only. */
const SLIP_CAPTURE_BLEED_CSS_PX = 2
/** Keep the spooler window alive briefly after silent print (Windows race). */
const SILENT_SPOOLER_SETTLE_MS = 1_500

async function waitForPrintReady(webContents) {
  await webContents.executeJavaScript(`
    new Promise((resolve) => {
      const finish = () => resolve(true);
      const waitImages = () => {
        const imgs = [...document.images];
        if (imgs.length === 0) return finish();
        Promise.all(
          imgs.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((r) => { img.onload = img.onerror = r; })
          )
        ).then(finish);
      };
      if (document.readyState === 'complete') {
        waitImages();
      } else {
        window.addEventListener('load', waitImages, { once: true });
      }
    })
  `)
  await webContents.executeJavaScript(`document.fonts?.ready ?? Promise.resolve()`)
}

/** Slip width in microns; height derived from rendered slip. */
function buildThermalPageSize(layoutHeightPx) {
  const widthMicrons = THERMAL_SLIP_WIDTH_MM * 1000
  if (layoutHeightPx > 0) {
    const heightMm = Math.ceil((layoutHeightPx * 25.4) / 96) + 4
    return { width: widthMicrons, height: Math.max(heightMm * 1000, 70_000) }
  }
  return { width: widthMicrons, height: 120_000 }
}

/** Thermal silent print: explicit micron page size, never forced DPI (blank/tiny on XP-80). */
function buildPrintOptions(config, deviceName, layout) {
  const opts = {
    silent: isSilentPrint(config),
    printBackground: true,
    margins: { marginType: 'none' },
    landscape: false
  }

  if (deviceName) {
    opts.deviceName = deviceName
  }

  const isThermal = !deviceName || THERMAL_PRINTER_RE.test(deviceName)
  if (isThermal) {
    opts.preferCSSPageSize = false
    opts.pageSize = buildThermalPageSize(layout?.height ?? 0)
  } else {
    opts.preferCSSPageSize = true
  }

  return opts
}

function isSilentPrint(config) {
  return config.silentPrint !== false
}

function printWithTimeout(webContents, opts, printWin, timeoutMs = SILENT_PRINT_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }

    const timer = setTimeout(() => {
      console.warn('[print-html-slip] print timed out', {
        timeoutMs,
        deviceName: opts.deviceName
      })
      finish({ success: false, failureReason: 'Print timed out' })
    }, timeoutMs)

    webContents.print(opts, (success, failureReason) => {
      finish({ success, failureReason: failureReason ?? 'Print failed' })
    })
  })
}

/**
 * Non-silent print must use `window.print()` on a visible window.
 * `webContents.print({ silent: false })` on an off-screen window often never shows a dialog on Windows.
 */
async function printInteractive(webContents, printWin) {
  printWin.setAlwaysOnTop(true, 'screen-saver')
  printWin.center()
  printWin.show()
  printWin.focus()

  return new Promise((resolve) => {
    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }

    const timer = setTimeout(() => {
      console.warn('[print-html-slip] interactive print timed out')
      finish({ success: false, failureReason: 'Print dialog timed out' })
    }, INTERACTIVE_PRINT_TIMEOUT_MS)

    webContents
      .executeJavaScript(`
        new Promise((resolve) => {
          let settled = false;
          const done = (success) => {
            if (settled) return;
            settled = true;
            resolve({ success });
          };
          window.addEventListener('afterprint', () => done(true), { once: true });
          window.print();
        })
      `)
      .then((result) => {
        finish({
          success: result?.success === true,
          failureReason: result?.success === true ? undefined : 'Print cancelled'
        })
      })
      .catch((err) => {
        finish({
          success: false,
          failureReason: err instanceof Error ? err.message : String(err)
        })
      })
  })
}

async function waitForCompositorFrames(webContents) {
  await webContents.executeJavaScript(
    `new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`
  )
}

async function readSlipRect(webContents) {
  return webContents.executeJavaScript(`
    (() => {
      const slip = document.querySelector('.slip');
      if (!slip) return null;
      const r = slip.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    })()
  `)
}

/** Full slip page (72mm safe width on 80mm roll). */
async function readPageRect(webContents) {
  return webContents.executeJavaScript(`
    (() => {
      const el = document.body;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height)
      };
    })()
  `)
}

/** Force a paint pass before silent print (off-screen windows often rasterize blank on Windows). */
async function forcePaint(webContents) {
  await waitForCompositorFrames(webContents)
  await webContents.executeJavaScript('void document.body.offsetHeight')
  const slipRect = await readSlipRect(webContents)

  if (slipRect?.width > 0 && slipRect?.height > 0) {
    await webContents.capturePage(slipRect)
  } else {
    await webContents.capturePage()
  }
}

function buildRasterSlipHtml(pngBase64) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 0; size: 72mm auto; }
    html, body { margin: 0; padding: 0; width: 72mm; background: #fff; }
    img { display: block; width: 72mm; height: auto; }
  </style>
</head>
<body><img alt="slip" src="data:image/png;base64,${pngBase64}" /></body>
</html>`
}

function writeTempPng(buffer) {
  const filePath = path.join(os.tmpdir(), `cockfight-slip-${randomUUID()}.png`)
  fs.writeFileSync(filePath, buffer)
  return filePath
}

function removeTempFile(filePath) {
  try {
    fs.unlinkSync(filePath)
  } catch {
    /* ignore */
  }
}

/** Brief on-screen paint so capturePage gets real pixels (no print dialog). */
async function armSilentPrintSurface(printWin, webContents) {
  printWin.center()
  if (!printWin.isVisible()) {
    printWin.showInactive()
  }
  await waitForCompositorFrames(webContents)
  await forcePaint(webContents)
  await new Promise((resolve) => setTimeout(resolve, 250))
}

async function captureSlipPng(webContents, captureRect, layoutHeightCssPx, deviceName) {
  const isThermal = !deviceName || THERMAL_PRINTER_RE.test(deviceName)
  const scaleFactor = isThermal ? THERMAL_CAPTURE_SCALE : 1
  const image = await webContents.capturePage(captureRect, { scaleFactor })
  let buffer = image.toPNG()
  let width = image.getSize().width
  let height = image.getSize().height
  let heightMm

  if (isThermal) {
    const normalized = normalizeThermalPng(buffer, layoutHeightCssPx)
    buffer = normalized.buffer
    width = normalized.width
    height = normalized.height
    heightMm = normalized.heightMm
  }

  return { path: writeTempPng(buffer), width, height, heightMm }
}

async function silentPrintRasterHtml(webContents, printWin, config, deviceName, slipRect, pngPath) {
  const rasterPath = writeTempHtml(
    buildRasterSlipHtml(fs.readFileSync(pngPath).toString('base64'))
  )

  try {
    await printWin.loadURL(pathToFileURL(rasterPath).href)
    await waitForPrintReady(webContents)
    await new Promise((resolve) => setTimeout(resolve, 200))
    await armSilentPrintSurface(printWin, webContents)

    const opts = buildPrintOptions(config, deviceName, slipRect)
    const printResult = await printWithTimeout(webContents, opts, printWin)
    await new Promise((resolve) => setTimeout(resolve, SILENT_SPOOLER_SETTLE_MS))
    return printResult
  } finally {
    removeTempFile(rasterPath)
  }
}

/**
 * Silent thermal: capture slip PNG, then on Windows send the bitmap with `mspaint /pt`
 * (reliable on XP-80). Chromium `webContents.print` often spools blank while preview looks fine.
 */
function fixedSlipCaptureRect() {
  return {
    x: 0,
    y: 0,
    width: thermalLayoutWidthPx(),
    height: thermalLayoutHeightPx()
  }
}

function slipCaptureRect(slipRect) {
  if (!slipRect || slipRect.width < 40 || slipRect.height < 40) {
    return fixedSlipCaptureRect()
  }

  const bleed = SLIP_CAPTURE_BLEED_CSS_PX
  return {
    x: Math.max(0, slipRect.x - bleed),
    y: Math.max(0, slipRect.y - bleed),
    width: slipRect.width + bleed * 2,
    height: slipRect.height + bleed * 2
  }
}

async function silentPrintSlip(webContents, printWin, config, layout) {
  const deviceName = await resolvePrinterName(webContents, config.printerName)
  webContents.setZoomFactor(1)
  await armSilentPrintSurface(printWin, webContents)

  const slipRect = await readSlipRect(webContents)
  if (!layout?.ok) {
    return {
      success: false,
      failureReason: layout?.reason ?? 'Slip layout not ready',
      deviceName,
      silent: true
    }
  }

  const captureRect = slipCaptureRect(slipRect)
  const layoutHeightCssPx =
    slipRect?.height >= 40 ? slipRect.height : captureRect.height
  const png = await captureSlipPng(webContents, captureRect, layoutHeightCssPx, deviceName)

  try {
    if (printWin.isVisible()) {
      printWin.hide()
    }

    const isThermal = !deviceName || THERMAL_PRINTER_RE.test(deviceName)
    if (process.platform === 'win32' && isThermal) {
      try {
        const method = await printPngSilentlyOnWindows(png.path, deviceName, png.width, png.height)
        await new Promise((resolve) => setTimeout(resolve, SILENT_SPOOLER_SETTLE_MS))
        console.log('[print-html-slip] silent thermal print', {
          method,
          deviceName,
          widthPx: png.width,
          heightPx: png.height,
          heightMm: png.heightMm ?? thermalHeightDots(),
          targetWidthPx: thermalWidthDots(),
          slipCssPx: slipRect
            ? `${Math.round(slipRect.width)}x${Math.round(slipRect.height)}`
            : 'n/a'
        })
        return { success: true, deviceName, silent: true, method }
      } catch (err) {
        console.warn('[print-html-slip] PowerShell thermal print failed, falling back to Chromium print', err)
      }
    }

    const printResult = await silentPrintRasterHtml(
      webContents,
      printWin,
      config,
      deviceName,
      slipRect,
      png.path
    )
    return { ...printResult, deviceName, silent: true, method: 'chromium' }
  } finally {
    removeTempFile(png.path)
  }
}

export async function verifySlipLayout(webContents) {
  try {
    return await webContents.executeJavaScript(`
      (() => {
        const slip = document.querySelector('.slip');
        if (!slip) return { ok: false, reason: 'missing .slip' };
        const rect = slip.getBoundingClientRect();
        const text = (slip.innerText || '').trim();
        return {
          ok: rect.height >= 40 && rect.width >= 40 && text.length > 8,
          height: rect.height,
          width: rect.width,
          textLen: text.length
        };
      })()
    `)
  } catch {
    return { ok: false, reason: 'layout check failed' }
  }
}

function writeTempHtml(html) {
  const filePath = path.join(os.tmpdir(), `cockfight-slip-${randomUUID()}.html`)
  fs.writeFileSync(filePath, html, 'utf8')
  return filePath
}

function removeTempHtml(filePath) {
  try {
    fs.unlinkSync(filePath)
  } catch {
    /* ignore */
  }
}

/**
 * Silent print of slip HTML using the same document the browser prints.
 *
 * @param {import('electron').BrowserWindow} _parentWin
 * @param {string} html — full slip document from `buildBetTicketSlipHtml` (renderer)
 * @param {{ printerName?: string, silentPrint?: boolean }} config
 */
export async function printHtmlSlip(_parentWin, html, config) {
  const tmpPath = writeTempHtml(html)

  const silent = isSilentPrint(config)

  // Silent: load hidden, then `armSilentPrintSurface` shows on-screen inactive before print.
  // Interactive: `printInteractive` centers and focuses before `window.print()`.
  const printWin = new BrowserWindow({
    show: false,
    useContentSize: silent,
    width: silent ? thermalLayoutWidthPx() : 420,
    height: silent ? thermalLayoutHeightPx() : 720,
    frame: !silent,
    skipTaskbar: silent,
    autoHideMenuBar: true,
    paintWhenInitiallyHidden: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false
    }
  })

  try {
    try {
      await printWin.loadURL(pathToFileURL(tmpPath).href)
    } catch (loadErr) {
      console.warn('[print-html-slip] file load failed, using data URL', loadErr)
      await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    }
    await waitForPrintReady(printWin.webContents)
    await new Promise((resolve) => setTimeout(resolve, SILENT_PRINT_SETTLE_MS))

    const layout = await verifySlipLayout(printWin.webContents)
    if (!layout.ok) {
      console.warn('[print-html-slip] slip not ready before print', layout)
      return { ok: false, error: layout.reason ?? 'Slip layout not ready' }
    }

    const result = silent
      ? await silentPrintSlip(printWin.webContents, printWin, config, layout)
      : await printInteractive(printWin.webContents, printWin)

    if (!result.success) {
      console.warn('[print-html-slip]', result.failureReason, {
        deviceName: result.deviceName,
        silent: result.silent ?? silent,
        layout
      })
      return { ok: false, error: result.failureReason }
    }

    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[print-html-slip]', message)
    return { ok: false, error: message }
  } finally {
    removeTempHtml(tmpPath)
    if (!printWin.isDestroyed()) {
      printWin.destroy()
    }
  }
}
