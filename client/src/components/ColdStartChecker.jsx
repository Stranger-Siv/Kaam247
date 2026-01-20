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
    const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0)
    const isActiveRef = useRef(true) // Track if component is still active

    // App features to showcase during loading
    const features = [
        {
            icon: '⚡',
            title: 'Lightning Fast',
            description: 'Get matched with nearby helpers in minutes, not days'
        },
        {
            icon: '📍',
            title: 'Hyperlocal Matching',
            description: 'Find helpers right in your neighborhood'
        },
        {
            icon: '🔒',
            title: 'Safe & Secure',
            description: 'Verified users and secure transactions'
        },
        {
            icon: '💰',
            title: 'Earn Extra Income',
            description: 'Make money by helping people nearby'
        },
        {
            icon: '💬',
            title: 'Direct Communication',
            description: 'Chat directly with task posters or workers'
        },
        {
            icon: '⭐',
            title: 'Build Your Reputation',
            description: 'Get rated and build trust in your community'
        }
    ]

    // Skip cold start check if explicitly disabled or in development
    // In dev mode, always render immediately to avoid blocking
    const skipCheck = import.meta.env.DEV || localStorage.getItem('skipColdStartCheck') === 'true'

    // Rotate features every 3 seconds
    useEffect(() => {
        if (!showWaitingPage) return

        const interval = setInterval(() => {
            setCurrentFeatureIndex((prev) => (prev + 1) % features.length)
        }, 3000)

        return () => clearInterval(interval)
    }, [showWaitingPage])

    useEffect(() => {
        // Skip check entirely if disabled - render immediately
        if (skipCheck) {
            setIsBackendReady(true)
            return
        }

        const checkBackendHealth = async () => {
            const maxRetries = 15 // Increased for better UX
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

    // Calculate progress percentage
    const progress = Math.min((retryCount / 15) * 100, 95) // Cap at 95% until actually ready

    // Show cold start waiting page only if backend didn't respond immediately
    if (showWaitingPage && !isBackendReady) {
        const currentFeature = features[currentFeatureIndex]

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob"></div>
                    <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-200 dark:pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
                </div>

                <div className="max-w-2xl w-full relative z-10">
                    {/* Main Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-gray-900/50 p-8 sm:p-10 lg:p-12 text-center border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
                        {/* Logo/Icon with Animation */}
                        <div className="mb-8">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-3xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                                <div className="relative">
                                    <svg
                                        className="w-12 h-12 sm:w-14 sm:h-14 text-white animate-pulse"
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
                                    {/* Pulsing Ring */}
                                    <div className="absolute inset-0 rounded-full border-2 border-white opacity-75 animate-ping"></div>
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            Kaam247
                        </h1>
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6">
                            Server Starting Up...
                        </h2>

                        {/* Progress Bar */}
                        <div className="mb-8">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out shadow-lg"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="h-full w-full bg-white/30 animate-shimmer"></div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {progress < 50 ? 'Waking up the server...' : progress < 80 ? 'Almost there...' : 'Final touches...'}
                            </p>
                        </div>

                        {/* Feature Card with Animation */}
                        <div className="mb-8">
                            <div 
                                key={currentFeatureIndex}
                                className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 sm:p-8 border border-blue-100 dark:border-gray-600 shadow-lg transform transition-all duration-500 ease-in-out animate-fade-in"
                            >
                                <div className="text-5xl sm:text-6xl mb-4 animate-bounce">
                                    {currentFeature.icon}
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    {currentFeature.title}
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {currentFeature.description}
                                </p>
                            </div>
                        </div>

                        {/* Loading Animation */}
                        <div className="flex justify-center items-center space-x-2 mb-6">
                            <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-3 h-3 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-3 h-3 bg-pink-500 dark:bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>

                        {/* Retry Count */}
                        {retryCount > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Checking connection... ({retryCount}/15)
                            </p>
                        )}

                        {/* Helpful Note */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Free tier services pause after inactivity. First request may take 30-60 seconds.</span>
                            </div>
                        </div>
                    </div>

                    {/* Feature Dots Indicator */}
                    <div className="flex justify-center gap-2 mt-6">
                        {features.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index === currentFeatureIndex
                                        ? 'bg-blue-500 dark:bg-blue-400 w-6'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Add custom animations to index.css */}
                <style>{`
                    @keyframes blob {
                        0%, 100% {
                            transform: translate(0, 0) scale(1);
                        }
                        33% {
                            transform: translate(30px, -50px) scale(1.1);
                        }
                        66% {
                            transform: translate(-20px, 20px) scale(0.9);
                        }
                    }
                    .animate-blob {
                        animation: blob 7s infinite;
                    }
                    .animation-delay-2000 {
                        animation-delay: 2s;
                    }
                    .animation-delay-4000 {
                        animation-delay: 4s;
                    }
                    @keyframes shimmer {
                        0% {
                            transform: translateX(-100%);
                        }
                        100% {
                            transform: translateX(100%);
                        }
                    }
                    .animate-shimmer {
                        animation: shimmer 2s infinite;
                    }
                    @keyframes fade-in {
                        from {
                            opacity: 0;
                            transform: translateY(10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .animate-fade-in {
                        animation: fade-in 0.5s ease-out;
                    }
                `}</style>
            </div>
        )
    }

    // Backend is ready - render the app
    return <>{children}</>
}

export default ColdStartChecker
