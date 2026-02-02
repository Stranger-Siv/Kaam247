import { useRef, useEffect } from 'react'

/**
 * Custom hook for pull-to-refresh functionality
 * @param {Function} onRefresh - Callback when pull-to-refresh is triggered
 * @param {Number} threshold - Distance in pixels to trigger refresh (default: 80)
 * @returns {Object} - Ref to attach to scrollable container
 */
export function usePullToRefresh(onRefresh, threshold = 80) {
  const containerRef = useRef(null)
  const touchStartYRef = useRef(null)
  const pullDistanceRef = useRef(0)
  const isRefreshingRef = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e) => {
      // Only trigger at the top of the scrollable area
      if (container.scrollTop === 0) {
        touchStartYRef.current = e.touches[0].clientY
        pullDistanceRef.current = 0
      }
    }

    const handleTouchMove = (e) => {
      if (touchStartYRef.current === null || isRefreshingRef.current) return

      const currentY = e.touches[0].clientY
      const deltaY = currentY - touchStartYRef.current

      // Only allow pull down when at top
      if (container.scrollTop === 0 && deltaY > 0) {
        pullDistanceRef.current = Math.min(deltaY, threshold * 1.5) // Cap at 1.5x threshold

        // Visual feedback (optional - can add spinner here)
        const pullPercentage = Math.min(pullDistanceRef.current / threshold, 1)
        if (pullPercentage >= 1) {
          // Show "Release to refresh" indicator
          container.style.transform = `translateY(${pullDistanceRef.current}px)`
        }
      }
    }

    const handleTouchEnd = () => {
      if (touchStartYRef.current === null) return

      if (pullDistanceRef.current >= threshold && !isRefreshingRef.current) {
        isRefreshingRef.current = true
        onRefresh()

        // Reset after refresh completes (caller should handle this)
        setTimeout(() => {
          isRefreshingRef.current = false
          pullDistanceRef.current = 0
          if (container) {
            container.style.transform = ''
          }
        }, 500)
      } else {
        // Reset if not enough pull
        pullDistanceRef.current = 0
        if (container) {
          container.style.transform = ''
        }
      }

      touchStartYRef.current = null
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onRefresh, threshold])

  return containerRef
}
