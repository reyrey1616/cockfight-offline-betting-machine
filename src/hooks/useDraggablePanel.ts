import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'

type DragHandleProps = {
  onPointerDown: (e: PointerEvent<HTMLElement>) => void
  onPointerMove: (e: PointerEvent<HTMLElement>) => void
  onPointerUp: (e: PointerEvent<HTMLElement>) => void
  onPointerCancel: (e: PointerEvent<HTMLElement>) => void
  style: { touchAction: 'none'; cursor: string }
}

type UseDraggablePanelOptions = {
  enabled: boolean
  /** Uniform visual scale for the panel (e.g. 0.8 = 80%). */
  scale?: number
}

/**
 * Free 2D drag for a centered panel. Position stays where the user leaves it until reset.
 */
export function useDraggablePanel({ enabled, scale = 1 }: UseDraggablePanelOptions): {
  dragHandleProps: DragHandleProps
  panelStyle: CSSProperties
  resetPosition: () => void
} {
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    dragging: false
  })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const resetPosition = useCallback(() => {
    dragRef.current.dragging = false
    setOffset({ x: 0, y: 0 })
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (!enabled) resetPosition()
  }, [enabled, resetPosition])

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!enabled) return
      if (e.button !== 0) return
      const target = e.target as HTMLElement
      if (target.closest('button, a, input, textarea, select, label')) return

      dragRef.current.startX = e.clientX
      dragRef.current.startY = e.clientY
      dragRef.current.originX = offset.x
      dragRef.current.originY = offset.y
      dragRef.current.dragging = true
      setIsDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [enabled, offset.x, offset.y]
  )

  const onPointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy
    })
  }, [])

  const onPointerUp = useCallback((e: PointerEvent<HTMLElement>) => {
    if (!dragRef.current.dragging) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragRef.current.dragging = false
    setIsDragging(false)
  }, [])

  const panelStyle: CSSProperties = {
    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
    transition: isDragging ? 'none' : undefined
  }

  const dragHandleProps: DragHandleProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    style: {
      touchAction: 'none',
      cursor: isDragging ? 'grabbing' : 'grab'
    }
  }

  return { dragHandleProps, panelStyle, resetPosition }
}
