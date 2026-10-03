// Hidden dashboard switch — no UI; set manually in DevTools:
//   localStorage.setItem('unclaimedShow', 'false')  → unpaid tickets table renders empty
//   localStorage.setItem('unclaimedShow', 'true')   → tickets shown (also the default when missing)

import { useState } from 'react'

const UNCLAIMED_SHOW_KEY = 'unclaimedShow'

function readUnclaimedShow(): boolean {
  try {
    return localStorage.getItem(UNCLAIMED_SHOW_KEY) !== 'false'
  } catch {
    return true
  }
}

/** Read once per dashboard mount — reopen the dashboard after changing the value. */
export function useShowUnpaidWinningTickets(): boolean {
  const [show] = useState(readUnclaimedShow)
  return show
}
