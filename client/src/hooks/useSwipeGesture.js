import { useRef, useEffect } from 'react'

/**
 * Custom hook for detecting swipe gestures
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback when swiped left
 * @param {Function} options.onSwipeRight - Callback when swiped right
 * @param {Function} options.onSwipeUp - Callback when swiped up
 * @param {Function} options.onSwipeDown - Callback when swiped down
 * @param {Number} options.threshold - Minimum distance in pixels to trigger swipe (default: 50)
 * @param {Number} options.velocityThreshold - Minimum velocity to trigger swipe (default: 0.3)
 * @returns {Object} - Ref to attach to element
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3
}) {
  const elementRef = useRef(null)
  const touchStartRef = useRef(null)
  const touchEndRef = useRef(null)
  const touchStartTimeRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      }
      touchStartTimeRef.current = Date.now()
    }

    const handleTouchMove = (e) => {
      // Prevent scrolling while swiping
      if (touchStartRef.current) {
        const touch = e.touches[0]
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)

        // If horizontal swipe is dominant, prevent vertical scroll
        if (deltaX > deltaY && deltaX > 10) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = (e) => {
      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      touchEndRef.current = {
        x: touch.clientX,
        y: touch.clientY
      }

      const deltaX = touchEndRef.current.x - touchStartRef.current.x
      const deltaY = touchEndRef.current.y - touchStartRef.current.y
      const deltaTime = Date.now() - touchStartTimeRef.current
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const velocity = distance / deltaTime

      // Check if swipe meets threshold
      if (distance >= threshold && velocity >= velocityThreshold) {
        const absX = Math.abs(deltaX)
        const absY = Math.abs(deltaY)

        // Determine swipe direction
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight()
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft()
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown()
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp()
          }
        }
      }

      // Reset
      touchStartRef.current = null
      touchEndRef.current = null
      touchStartTimeRef.current = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold])

  return elementRef
}
