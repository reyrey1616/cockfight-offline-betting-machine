import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FightBoardLayout } from '@/components/fight-board/FightBoardLayout'

const baseProps = {
  meronPool: '1000.00',
  walaPool: '500.00',
  meronOdds: 1.5,
  walaOdds: 2.1,
  fightNumber: 7,
  fightStatus: 'OPEN' as const,
  sessionStats: { meronWins: 2, walaWins: 1, draws: 0, cancelled: 1 },
  history: [
    { fightNumber: 6, result: 'MERON' as const },
    { fightNumber: 5, result: 'WALA' as const }
  ],
  tickerMessage: 'FIGHT #7 IS NOW OPEN. YOU MAY NOW PLACE YOUR BETS!!!'
}

describe('FightBoardLayout', () => {
  it('renders fight number with hash prefix and history rows', () => {
    render(<FightBoardLayout {...baseProps} />)
    expect(screen.getByText('#7')).toBeInTheDocument()
    expect(screen.getByText('#6')).toBeInTheDocument()
    expect(screen.getAllByText('MERON').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(baseProps.tickerMessage)).toBeInTheDocument()
  })

  it('shows held state on meron side', () => {
    render(<FightBoardLayout {...baseProps} meronSideHeld />)
    expect(screen.getByText('Held')).toBeInTheDocument()
    expect(screen.getAllByText(/Meron held/i).length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty history message', () => {
    render(<FightBoardLayout {...baseProps} history={[]} />)
    expect(screen.getByText(/No finished fights/i)).toBeInTheDocument()
  })
})
