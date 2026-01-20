import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../config/env'

/**
 * ColdStartChecker Component
 * 
 * Detects when Render backend is in cold start (paused) and shows
 * a waiting page until the service is ready.
 * 
 * This only shows during initial cold start, not during regular loading states.
 */
function ColdStartChecker({ children }) {
    const [isBackendReady, setIsBackendReady] = useState(false)
    const [showWaitingPage, setShowWaitingPage] = useState(false)
    const [retryCount, setRetryCount] = useState(0)
    const isActiveRef = useRef(true) // Track if component is still active

    // Skip cold start check if explicitly disabled or in development
    // In dev mode, always render immediately to avoid blocking
    const skipCheck = import.meta.env.DEV || localStorage.getItem('skipColdStartCheck') === 'true'

    useEffect(() => {
        // Skip check entirely if disabled - render immediately
        if (skipCheck) {
            setIsBackendReady(true)
            return
        }

        const checkBackendHealth = async () => {
            const maxRetries = 10 // Reduced retries for faster fallback
            const retryDelay = 2000 // 2 seconds between retries
            const initialTimeout = 4000 // 4 seconds for initial check

            // Quick initial check - if backend responds, don't show waiting page at all
            let initialCheckPassed = false
            try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), initialTimeout)

                const response = await fetch(`${API_BASE_URL}/health`, {
                    method: 'GET',
                    signal: controller,
                    headers: {
                        'Accept': 'application/json'
                    },
                    // Add mode: 'no-cors' won't work for checking, but we can try with credentials
                    credentials: 'omit' // Don't send cookies for health check
                })

                clearTimeout(timeoutId)

                if (response.ok && isActiveRef.current) {
                    // Backend responded immediately - no cold start!
                    setIsBackendReady(true)
                    initialCheckPassed = true
                    return // Exit immediately, don't show waiting page
                }
            } catch (error) {
                // Only treat AbortError (our timeout) as a potential cold start
                // Other errors (CORS, 404, etc.) mean backend might be running but health endpoint has issues
                // In that case, proceed anyway to avoid blocking users
                const isOurTimeout = error.name === 'AbortError'

                if (!isOurTimeout && isActiveRef.current) {
                    // Not a timeout - likely CORS, wrong URL, or other config issue
                    // Backend is probably running, just proceed
                    setIsBackendReady(true)
                    return
                }
                // If it's our timeout, continue to check for cold start
            }

            // Only show waiting page if initial check failed with CLEAR network timeout
            // If we're not sure, proceed anyway to avoid blocking users
            if (!initialCheckPassed && isActiveRef.current) {
                // Give it a moment - sometimes first request is just slow
                await new Promise(resolve => setTimeout(resolve, 2000))

                // Check one more time before showing waiting page
                try {
                    const quickController = new AbortController()
                    const quickTimeout = setTimeout(() => quickController.abort(), 3000)
                    const quickCheck = await fetch(`${API_BASE_URL}/health`, {
                        method: 'GET',
                        signal: quickController.signal,
                        headers: { 'Accept': 'application/json' },
                        credentials: 'omit'
                    })
                    clearTimeout(quickTimeout)
                    if (quickCheck.ok && isActiveRef.current) {
                        setIsBackendReady(true)
                        return
                    }
                } catch (e) {
                    // Only our timeout (AbortError) indicates potential cold start
                    // Other errors mean we should proceed
                    if (e.name !== 'AbortError' && isActiveRef.current) {
                        setIsBackendReady(true)
                        return
                    }
                    // If it's our timeout, continue to show waiting page
                }

                if (isActiveRef.current) {
                    setShowWaitingPage(true)
                }
            } else {
                // Initial check passed or we determined it's not a cold start
                return
            }

            // Now retry until backend is ready (only if we're showing waiting page)
            for (let attempt = 0; attempt < maxRetries && isActiveRef.current; attempt++) {
                try {
                    const controller = new AbortController()
                    const timeoutId = setTimeout(() => controller.abort(), 5000)

                    const response = await fetch(`${API_BASE_URL}/health`, {
                        method: 'GET',
                        signal: controller,
                        headers: {
                            'Accept': 'application/json'
                        },
                        credentials: 'omit'
                    })

                    clearTimeout(timeoutId)

                    if (response.ok && isActiveRef.current) {
                        // Backend is ready!
                        setIsBackendReady(true)
                        setShowWaitingPage(false)
                        return // Stop checking immediately
                    }
                } catch (error) {
                    // Backend not ready yet - continue retrying
                }

                // Update retry count for UI feedback
                if (isActiveRef.current) {
                    setRetryCount(attempt + 1)
                }

                // Wait before next retry (except on last attempt)
                if (attempt < maxRetries - 1 && isActiveRef.current) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay))
                }
            }

            // If we've exhausted all retries, assume backend is ready (or proceed anyway)
            if (isActiveRef.current) {
                setIsBackendReady(true)
                setShowWaitingPage(false)
            }
        }

        // Start checking immediately
        checkBackendHealth()

        // Cleanup: mark as inactive if component unmounts
        return () => {
            isActiveRef.current = false
        }
    }, [])

    // Show cold start waiting page only if backend didn't respond immediately
    if (showWaitingPage && !isBackendReady) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-8 text-center">
                    {/* Logo/Icon */}
                    <div className="mb-6">
                        <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <svg
                                className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                        Service Starting Soon
                    </h1>

                    {/* Message */}
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Our service is waking up from sleep mode. This usually takes 30-60 seconds.
                    </p>

                    {/* Loading Animation */}
                    <div className="flex justify-center items-center space-x-2 mb-4">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>

                    {/* Retry Count (optional feedback) */}
                    {retryCount > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Checking... ({retryCount}/{30})
                        </p>
                    )}

                    {/* Helpful Note */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            💡 Tip: Free tier services pause after inactivity. First request may take a moment.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Backend is ready - render the app
    return <>{children}</>
}

export default ColdStartChecker

