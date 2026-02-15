import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../config/env'

/**
 * ColdStartChecker Component
 * 
 * Detects when Render backend is in cold start (paused) and shows
 * a beautiful waiting page with app features until the service is ready.
 * 
 * This only shows during initial cold start, not during regular loading states.
 */
function ColdStartChecker({ children }) {
    const [isBackendReady, setIsBackendReady] = useState(false)
    const [showWaitingPage, setShowWaitingPage] = useState(false)
    const [retryCount, setRetryCount] = useState(0)
    const isActiveRef = useRef(true)

    // Skip cold start check if explicitly disabled or in development
    const skipCheck = import.meta.env.DEV || localStorage.getItem('skipColdStartCheck') === 'true'

    useEffect(() => {
        // Skip check entirely if disabled - render immediately
        if (skipCheck) {
            setIsBackendReady(true)
            return
        }

        const checkBackendHealth = async () => {
            const maxRetries = 15 // Increased for better UX
            const retryDelay = 2000 // 2 seconds between retries
            // Slow networks / cold starts can take 20-60s; don't fail fast.
            const initialTimeout = 15000 // 15 seconds for initial check

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
                    const quickTimeout = setTimeout(() => quickController.abort(), 8000)
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
                    const timeoutId = setTimeout(() => controller.abort(), 15000)

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

    // Calculate progress percentage
    const progress = Math.min((retryCount / 15) * 100, 95) // Cap at 95% until actually ready

    // Show cold start waiting page only if backend didn't respond immediately
    // Styled like McFleet: dark card, logo, "Waking up", explanation, duration, assurance, progress bar, footer
    if (showWaitingPage && !isBackendReady) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 py-6">
                <div className="max-w-md w-full">
                    {/* Main card - dark grey rounded */}
                    <div className="bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 text-center border border-gray-700">
                        {/* Logo at top */}
                        <div className="mb-6 flex justify-center">
                            <img
                                src="/icons/kaam247_pwa.jpeg"
                                alt=""
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-contain bg-gray-700/50 p-1.5"
                            />
                        </div>

                        {/* Title */}
                        <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">
                            Waking up Kaam247
                        </h1>

                        {/* Explanation */}
                        <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                            Our servers pause when inactive to keep the platform fast and affordable.
                        </p>

                        {/* Duration */}
                        <p className="text-sm text-gray-300 mb-4">
                            This usually takes 20–40 seconds.
                        </p>

                        {/* Assurance */}
                        <p className="text-sm text-gray-400 mb-6">
                            Your tasks and account remain fully protected.
                        </p>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div
                                className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Footer disclaimer */}
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-6">
                            All requests are served directly from Kaam247.
                        </p>
                    </div>
                </div>

                <style>{`
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                `}</style>
            </div>
        )
    }

    // Backend is ready - render the app
    return <>{children}</>
}

export default ColdStartChecker
