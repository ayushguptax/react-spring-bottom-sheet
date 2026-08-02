 
import React, { forwardRef, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { BottomSheet as _BottomSheet } from './BottomSheet'
import type { Props, RefHandles, SpringEvent } from './types'
import { useLayoutEffect } from './hooks'

export type {
  RefHandles as BottomSheetRef,
  Props as BottomSheetProps,
} from './types'

// Renders into a `<div data-rsbs-portal>` appended to the end of `<body>`.
// It has to be a direct child of body: `useAriaHider` walks `body > *` and skips
// the sheet's own parent node when setting `aria-hidden` on the rest of the page.
// Children are held back until the node exists so we never call createPortal with
// a null container, which also keeps this a no-op during SSR.
function Portal({ children }: { children: React.ReactNode }) {
  const [mountNode, setMountNode] = useState<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const node = document.createElement('div')
    node.setAttribute('data-rsbs-portal', '')
    document.body.appendChild(node)
    setMountNode(node)

    return () => {
      document.body.removeChild(node)
    }
  }, [])

  return mountNode ? createPortal(children, mountNode) : null
}

export const BottomSheet = forwardRef<RefHandles, Props>(function BottomSheet(
  { onSpringStart, onSpringEnd, skipInitialTransition, ...props },
  ref
) {
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof requestAnimationFrame>>(undefined)
  const lastSnapRef = useRef(null)
  const initialStateRef = useRef<'OPEN' | 'CLOSED'>(
    skipInitialTransition && props.open ? 'OPEN' : 'CLOSED'
  )

  useLayoutEffect(() => {
    if (props.open) {
      cancelAnimationFrame(timerRef.current)
      setMounted(true)
      return () => {
        initialStateRef.current = 'CLOSED'
      }
    }
  }, [props.open])

  const handleSpringStart = useCallback(
    async (event: SpringEvent) => {
      await onSpringStart?.(event)
      if (event.type === 'OPEN') cancelAnimationFrame(timerRef.current)
    },
    [onSpringStart]
  )

  const handleSpringEnd = useCallback(
    async (event: SpringEvent) => {
      await onSpringEnd?.(event)
      if (event.type === 'CLOSE') {
        timerRef.current = requestAnimationFrame(() => setMounted(false))
      }
    },
    [onSpringEnd]
  )

  if (!mounted) return null

  return (
    <Portal>
      <_BottomSheet
        {...props}
        lastSnapRef={lastSnapRef}
        ref={ref}
        initialState={initialStateRef.current}
        onSpringStart={handleSpringStart}
        onSpringEnd={handleSpringEnd}
      />
    </Portal>
  )
})
