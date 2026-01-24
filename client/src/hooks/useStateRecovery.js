import { useState, useCallback } from 'react'
import { performStateRecovery } from '../utils/stateRecovery'

/**
 * Hook for state recovery on page load and reconnection
 * 
 * Usage:
 * const { recoverState, isRecovering } = useStateRecovery(userMode, user?.id)
 * 
 * Call recoverState() on page load or when needed
 */
export const useStateRecovery = (userMode, userId) => {
  const [isRecovering, setIsRecovering] = useState(false)

  const recoverState = useCallback(async () => {
    if (!userId) return null

    setIsRecovering(true)
    try {
      const recoveredState = await performStateRecovery(userMode, userId)
      return recoveredState
    } catch (error) {
      return null
    } finally {
      setIsRecovering(false)
    }
  }, [userMode, userId])

  return { recoverState, isRecovering }
}

