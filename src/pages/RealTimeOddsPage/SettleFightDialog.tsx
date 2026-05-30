import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { nativeModalDialogClassName } from '@/lib/nativeModalDialogClassName'
import type { SettleFightOutcome } from '@/types/api'

const COPY: Record<
  SettleFightOutcome,
  { title: string; body: string; confirm: string }
> = {
  MERON: {
    title: 'Declare Meron wins?',
    body: 'All pending bets will be settled against the frozen pools and snapshotted commission.',
    confirm: 'Save Meron win'
  },
  WALA: {
    title: 'Declare Wala wins?',
    body: 'All pending bets will be settled against the frozen pools and snapshotted commission.',
    confirm: 'Save Wala win'
  },
  DRAW: {
    title: 'Declare a draw?',
    body: 'All pending stakes are refunded (draw / patas / balik taya). Voided tickets stay voided.',
    confirm: 'Save draw'
  }
}

export interface SettleFightDialogProps {
  fightNumber: number
  outcome: SettleFightOutcome | null
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

export function SettleFightDialog({
  fightNumber,
  outcome,
  isPending,
  onClose,
  onConfirm
}: SettleFightDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (outcome) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [outcome])

  if (!outcome) return null

  const meta = COPY[outcome]

  return (
    <dialog
      ref={ref}
      className={nativeModalDialogClassName()}
      onCancel={(e) => {
        e.preventDefault()
        if (!isPending) onClose()
      }}
      onClose={onClose}
    >
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">{meta.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fight #{fightNumber} — {meta.body}
        </p>
      </div>
      <div className="flex justify-end gap-2 border-t px-4 py-3">
        <Button type="button" variant="outline" disabled={isPending} onClick={onClose}>
          Back
        </Button>
        <Button type="button" disabled={isPending} onClick={onConfirm}>
          {isPending ? 'Saving…' : meta.confirm}
        </Button>
      </div>
    </dialog>
  )
}
