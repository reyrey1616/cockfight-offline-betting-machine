/** CSS px at 96dpi — hidden Electron print windows often lay out `mm` as ~0. */
export const MM_TO_PX = 96 / 25.4

export function mmToPx(mm) {
  return Math.round(mm * MM_TO_PX)
}

export const ROLL_WIDTH_MM = 80
