import type { Collector } from '@/types/api'

/**
 * Opens a print-only window using a pre-rendered barcode image (e.g. from the
 * preview modal canvas). Returns false if the browser blocked the popup.
 */
export function printCollectorBadgeWithBarcodeImage(
  collector: Collector,
  barcodePngDataUrl: string
): boolean {
  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w?.document.body) return false

  const doc = w.document
  doc.title = `Collector badge — ${collector.code}`

  const style = doc.createElement('style')
  style.textContent = `
    body { font-family: system-ui, sans-serif; padding: 24px; text-align: center; color: #111; }
    h1 { font-size: 1rem; font-weight: 600; margin: 0 0 8px; }
    .name { font-size: 1.125rem; margin: 0 0 16px; }
    .barcode { max-width: 100%; height: auto; margin: 0 auto; display: block; }
    .code { font-family: ui-monospace, monospace; font-size: 1.25rem; letter-spacing: 0.12em; margin: 16px 0 0; }
    @media print { @page { margin: 12mm; } body { padding: 0; } }
  `
  doc.head.appendChild(style)

  const h1 = doc.createElement('h1')
  h1.textContent = 'Collector badge'
  doc.body.appendChild(h1)

  const nameEl = doc.createElement('p')
  nameEl.className = 'name'
  nameEl.textContent = collector.name
  doc.body.appendChild(nameEl)

  const img = doc.createElement('img')
  img.className = 'barcode'
  img.src = barcodePngDataUrl
  img.alt = `Barcode ${collector.code}`
  doc.body.appendChild(img)

  const codeEl = doc.createElement('p')
  codeEl.className = 'code'
  codeEl.textContent = collector.code
  doc.body.appendChild(codeEl)

  w.focus()
  setTimeout(() => {
    w.print()
    w.close()
  }, 200)
  return true
}
