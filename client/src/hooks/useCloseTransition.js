import { useState, useCallback, useRef, useEffect } from 'react'

const DEFAULT_DURATION_MS = 220

/**
 * Hook for modal/panel close transition. Call requestClose() when user closes;
 * it sets exiting state, applies exit animation, then calls onClose after duration.
 * Use isExiting to add exit animation classes to backdrop and panel.
 */
export function useCloseTransition(onClose, durationMs = DEFAULT_DURATION_MS) {
  const [isExiting, setIsExiting] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const requestClose = useCallback(() => {
    if (isExiting) return
    setIsExiting(true)
    timeoutRef.current = setTimeout(() => {
      onClose?.()
      setIsExiting(false)
    }, durationMs)
  }, [onClose, durationMs, isExiting])

  return { isExiting, requestClose }
}
