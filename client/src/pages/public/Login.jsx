import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import { GOOGLE_CLIENT_ID } from '../../config/env'
import { RETURN_URL_PARAM, LOGIN_INTENT_MESSAGES, isSafeReturnUrl } from '../../utils/authIntents'

function Login() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { login, loginWithGoogle, isAuthenticated, loading } = useAuth()

    // Redirect-after-login: read intended destination from URL (set by ProtectedRoute)
    const returnUrl = searchParams.get(RETURN_URL_PARAM) || ''
    const messageKey = searchParams.get('message') || ''
    const intentMessage = (messageKey && LOGIN_INTENT_MESSAGES[messageKey]) ? LOGIN_INTENT_MESSAGES[messageKey] : null

    const getRedirectPath = () => {
        if (isSafeReturnUrl(returnUrl)) return returnUrl
        const userInfo = localStorage.getItem('kaam247_user')
        try {
            const parsed = userInfo ? JSON.parse(userInfo) : null
            return parsed?.role === 'admin' ? '/admin' : '/dashboard'
        } catch {
            return '/dashboard'
        }
    }

    // Redirect if already authenticated (preserve returnUrl so user lands where they intended)
    useEffect(() => {
        if (loading) return

        const token = localStorage.getItem('kaam247_token')
        const userInfo = localStorage.getItem('kaam247_user')

        if (isAuthenticated || token) {
            navigate(getRedirectPath(), { replace: true })
        }
    }, [isAuthenticated, loading, navigate, returnUrl])

    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sessionExpired, setSessionExpired] = useState(false)
    const [formData, setFormData] = useState({
        identifier: '', // email or phone
        password: ''
    })

    useEffect(() => {
        try {
            if (sessionStorage.getItem('kaam247_session_expired') === '1') {
                sessionStorage.removeItem('kaam247_session_expired')
                setSessionExpired(true)
            }
        } catch {
            // ignore
        }
    }, [])

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        const identifier = (formData.identifier || '').trim()
        const password = formData.password

        if (!identifier || !password) {
            setError('Please enter your email/phone and password')
            setIsLoading(false)
            return
        }

        const result = await login(identifier, password)

        if (result.success) {
            navigate(getRedirectPath())
        } else {
            setError(result.error || 'Invalid email/phone or password')
        }

        setIsLoading(false)
    }

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left Side - Welcome Content */}
                <div className="hidden lg:block space-y-6">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                            Welcome Back!
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                            Sign in to continue connecting with local helpers and getting things done.
                        </p>
                    </div>

                    <div className="space-y-4 pt-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Hyperlocal Matching</h3>
                                <p className="text-gray-600 dark:text-gray-400">Connect with helpers right in your neighborhood</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Safe & Secure</h3>
                                <p className="text-gray-600 dark:text-gray-400">Verified users and secure transactions</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Fast & Easy</h3>
                                <p className="text-gray-600 dark:text-gray-400">Get matched in minutes, not days</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full min-w-0">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 sm:p-8 lg:p-10 border border-gray-200 dark:border-gray-700 max-w-full min-w-0">
                        <div className="text-center mb-8">
                            <div className="lg:hidden mb-4">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    Welcome Back!
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Sign in to your account
                                </p>
                            </div>
                            <div className="hidden lg:block">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    Login
                                </h1>
                            </div>
                            {intentMessage && (
                                <p className="mt-3 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 inline-block">
                                    {intentMessage}
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 min-w-0">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email / Phone
                                </label>
                                <input
                                    type="text"
                                    value={formData.identifier}
                                    onChange={(e) => handleInputChange('identifier', e.target.value)}
                                    placeholder="Enter your email or phone"
                                    className="w-full min-w-0 max-w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full min-w-0 max-w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base"
                                    required
                                />
                            </div>

                            {sessionExpired && (
                                <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                    Your session has expired. Please sign in again.
                                </div>
                            )}
                            {error && (
                                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-base min-h-[48px] ${isLoading
                                    ? 'bg-blue-400 dark:bg-blue-600 cursor-not-allowed'
                                    : 'hover:bg-blue-700 dark:hover:bg-blue-600'
                                    }`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Login'
                                )}
                            </button>

                            <div className="mt-4 min-w-0 max-w-full overflow-hidden">
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200 dark:border-gray-600" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
                                    </div>
                                </div>
                                <div className="flex justify-center min-w-0 max-w-full">
                                    {GOOGLE_CLIENT_ID ? (
                                        <GoogleLogin
                                            onSuccess={async (credentialResponse) => {
                                                if (!credentialResponse?.credential) return
                                                const result = await loginWithGoogle(credentialResponse.credential)
                                                if (result?.success) {
                                                    if (result.profileSetupRequired) {
                                                        navigate('/setup-profile', { replace: true, state: { returnUrl: isSafeReturnUrl(returnUrl) ? returnUrl : undefined } })
                                                    } else {
                                                        navigate(getRedirectPath(), { replace: true })
                                                    }
                                                }
                                            }}
                                            onError={() => {
                                                setError('Google sign-in failed. Please try again.')
                                            }}
                                            theme="outline"
                                            size="large"
                                            text="continue_with"
                                            shape="rectangular"
                                            width="320"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 w-full max-w-[320px]">
                                            <button
                                                type="button"
                                                disabled
                                                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm font-medium"
                                            >
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                </svg>
                                                Continue with Google
                                            </button>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                                Add VITE_GOOGLE_CLIENT_ID to client .env to enable
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Don't have an account?{' '}
                                <Link
                                    to="/register"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 font-medium"
                                >
                                    Create account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
