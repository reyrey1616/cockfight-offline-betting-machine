import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FightAdminToolbar } from '@/pages/RealTimeOddsPage/FightAdminToolbar'
import { makeFight } from '@/test/fixtures'

function idleMut() {
  return { mutate: vi.fn(), isPending: false }
}

describe('FightAdminToolbar', () => {
  it('disables close betting when fight is not open', () => {
    render(
      <FightAdminToolbar
        fight={makeFight({ status: 'CLOSED' })}
        createFight={idleMut()}
        closeFight={idleMut()}
        setFightLastCall={idleMut()}
        resumeFightOpen={idleMut()}
        reopenFight={idleMut()}
        settleFight={idleMut()}
        cancelFight={idleMut()}
        holdSide={idleMut()}
        unholdSide={idleMut()}
      />
    )
    expect(screen.getByRole('button', { name: /close betting/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /re-open betting/i })).toBeEnabled()
  })

  it('fires hold meron mutation when open', async () => {
    const user = userEvent.setup()
    const holdSide = idleMut()

    render(
      <FightAdminToolbar
        fight={makeFight({ status: 'OPEN' })}
        createFight={idleMut()}
        closeFight={idleMut()}
        setFightLastCall={idleMut()}
        resumeFightOpen={idleMut()}
        reopenFight={idleMut()}
        settleFight={idleMut()}
        cancelFight={idleMut()}
        holdSide={holdSide}
        unholdSide={idleMut()}
      />
    )

    await user.click(screen.getByRole('button', { name: /^Hold Meron$/i }))
    expect(holdSide.mutate).toHaveBeenCalled()
  })

  it('opens settle dialog when meron wins is clicked on closed fight', async () => {
    const user = userEvent.setup()

    render(
      <FightAdminToolbar
        fight={makeFight({ status: 'CLOSED', fightNumber: 9 })}
        createFight={idleMut()}
        closeFight={idleMut()}
        setFightLastCall={idleMut()}
        resumeFightOpen={idleMut()}
        reopenFight={idleMut()}
        settleFight={idleMut()}
        cancelFight={idleMut()}
        holdSide={idleMut()}
        unholdSide={idleMut()}
      />
    )

    await user.click(screen.getByRole('button', { name: /meron wins/i }))
    expect(screen.getByRole('heading', { name: /declare meron wins/i })).toBeInTheDocument()
  })
})
