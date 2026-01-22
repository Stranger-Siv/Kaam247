import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import PhoneLogin from '../../components/PhoneLogin'
import ProfileSetup from '../../components/ProfileSetup'
import GoogleSignIn from '../../components/GoogleSignIn'

function Login() {
    const navigate = useNavigate()
    const { login, isAuthenticated, user } = useAuth()
    const [loginMethod, setLoginMethod] = useState('phone') // 'phone' or 'email'
    const [showProfileSetup, setShowProfileSetup] = useState(false)

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const userInfo = localStorage.getItem('kaam247_user')
            if (userInfo) {
                try {
                    const parsedUser = JSON.parse(userInfo)
                    if (parsedUser.role === 'admin') {
                        navigate('/admin', { replace: true })
                    } else {
                        navigate('/dashboard', { replace: true })
                    }
                } catch {
                    navigate('/dashboard', { replace: true })
                }
            } else {
                navigate('/dashboard', { replace: true })
            }
        }
    }, [isAuthenticated, navigate])

    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        identifier: '', // email or phone
        password: ''
    })

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        if (!formData.identifier || !formData.password) {
            setError('Please enter your email/phone and password')
            setIsLoading(false)
            return
        }

        const result = await login(formData.identifier, formData.password)

        if (result.success) {
            const userInfo = localStorage.getItem('kaam247_user')
            if (userInfo) {
                try {
                    const parsedUser = JSON.parse(userInfo)
                    if (parsedUser.role === 'admin') {
                        navigate('/admin')
                    } else {
                        navigate('/dashboard')
                    }
                } catch {
                    navigate('/dashboard')
                }
            } else {
                navigate('/dashboard')
            }
        } else {
            setError(result.error || 'Invalid email/phone or password')
        }

        setIsLoading(false)
    }

    // Show profile setup if needed
    if (showProfileSetup) {
        return (
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full overflow-x-hidden">
                <ProfileSetup
                    onComplete={() => {
                        const userInfo = localStorage.getItem('kaam247_user')
                        if (userInfo) {
                            try {
                                const parsedUser = JSON.parse(userInfo)
                                if (parsedUser.role === 'admin') {
                                    navigate('/admin')
                                } else {
                                    navigate('/dashboard')
                                }
                            } catch {
                                navigate('/dashboard')
                            }
                        } else {
                            navigate('/dashboard')
                        }
                    }}
                />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
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
                <div className="w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 sm:p-8 lg:p-10 border border-gray-100 dark:border-gray-700">
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
                        </div>

                        {/* Google Sign-In Button */}
                        <div className="mb-6">
                            <GoogleSignIn
                                onSuccess={(result) => {
                                    if (result.requiresProfileSetup) {
                                        setShowProfileSetup(true)
                                    } else {
                                        const userInfo = localStorage.getItem('kaam247_user')
                                        if (userInfo) {
                                            try {
                                                const parsedUser = JSON.parse(userInfo)
                                                if (parsedUser.role === 'admin') {
                                                    navigate('/admin')
                                                } else {
                                                    navigate('/dashboard')
                                                }
                                            } catch {
                                                navigate('/dashboard')
                                            }
                                        } else {
                                            navigate('/dashboard')
                                        }
                                    }
                                }}
                                onError={(error) => setError(error)}
                            />
                        </div>

                        {/* Divider */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        {/* Login Method Tabs */}
                        <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setLoginMethod('phone')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                    loginMethod === 'phone'
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                Phone OTP
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginMethod('email')}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                    loginMethod === 'email'
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                Email/Password
                            </button>
                        </div>

                        {/* Phone OTP Login */}
                        {loginMethod === 'phone' ? (
                            <PhoneLogin
                                onSuccess={(result) => {
                                    if (result.requiresProfileSetup) {
                                        setShowProfileSetup(true)
                                    } else {
                                        const userInfo = localStorage.getItem('kaam247_user')
                                        if (userInfo) {
                                            try {
                                                const parsedUser = JSON.parse(userInfo)
                                                if (parsedUser.role === 'admin') {
                                                    navigate('/admin')
                                                } else {
                                                    navigate('/dashboard')
                                                }
                                            } catch {
                                                navigate('/dashboard')
                                            }
                                        } else {
                                            navigate('/dashboard')
                                        }
                                    }
                                }}
                                onCancel={() => setLoginMethod('email')}
                            />
                        ) : (
                            /* Email/Password Login */
                            <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email / Phone
                        </label>
                        <input
                            type="text"
                            value={formData.identifier}
                            onChange={(e) => handleInputChange('identifier', e.target.value)}
                            placeholder="Enter your email or phone"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base"
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
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-base min-h-[48px] ${
                            isLoading 
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
                </form>
                        )}

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
