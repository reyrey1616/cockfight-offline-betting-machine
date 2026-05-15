import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ConnectionStatus } from '@/components/fight-board/ConnectionStatus'

describe('ConnectionStatus', () => {
  it('shows live label when socket is open', () => {
    render(<ConnectionStatus status="open" lastError={null} />)
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('shows last error when disconnected', () => {
    render(<ConnectionStatus status="closed" lastError="Network down" />)
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText('Network down')).toBeInTheDocument()
  })

  it('hides error text while live', () => {
    render(<ConnectionStatus status="open" lastError="ignored" />)
    expect(screen.queryByText('ignored')).not.toBeInTheDocument()
  })
})
