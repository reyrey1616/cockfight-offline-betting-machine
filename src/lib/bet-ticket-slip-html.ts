import { THERMAL_SLIP_76X60_CSS } from '@/lib/thermal-slip-76x60-css'

/** Fields printed on 80mm thermal bet slips (76mm × 60mm). */
export interface BetTicketSlipFields {
  fightNumber: string
  bettingSide: string
  betAmount: string
  tellerName: string
  placedAt: string
  barcodePngDataUrl: string
  code: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Electron silent print loads this exact HTML from the renderer via IPC. */
export const BET_TICKET_SLIP_CSS = THERMAL_SLIP_76X60_CSS

export function buildBetTicketSlipHtml(fields: BetTicketSlipFields): string {
  const fightNumber = escapeHtml(fields.fightNumber)
  const bettingSide = escapeHtml(fields.bettingSide)
  const betAmount = escapeHtml(fields.betAmount)
  const teller = escapeHtml(fields.tellerName.trim() || '—')
  const placedAt = escapeHtml(fields.placedAt)
  const code = escapeHtml(fields.code)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${BET_TICKET_SLIP_CSS}
  </style>
</head>
<body>
  <div class="slip">
    <div class="barcode-wrap">
      <img class="barcode" src="${fields.barcodePngDataUrl}" alt="${code}" />
      <p class="barcode-code">${code}</p>
    </div>
    <div class="meta">
      <p class="line"><span class="label">Fight #:</span> <span class="value">${fightNumber}</span></p>
      <p class="line"><span class="label">Betting side:</span> <span class="value">${bettingSide}</span></p>
      <p class="line"><span class="label">Bet amount:</span> <span class="value emphasis">${betAmount}</span></p>
      <p class="line"><span class="label">Teller:</span> <span class="value">${teller}</span></p>
      <p class="line"><span class="label">Date and timestamp:</span> <span class="value">${placedAt}</span></p>
    </div>
  </div>
</body>
</html>`
}
