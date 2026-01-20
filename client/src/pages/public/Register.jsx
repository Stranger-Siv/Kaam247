import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

function Register() {
    const navigate = useNavigate()
    const { register, isAuthenticated } = useAuth()

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
        name: '',
        email: '',
        phone: '',
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

        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
            setError('Please fill in all fields')
            setIsLoading(false)
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long')
            setIsLoading(false)
            return
        }

        const result = await register(
            formData.name,
            formData.email,
            formData.phone,
            formData.password
        )

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
            setError(result.error || 'Registration failed. Please try again.')
        }

        setIsLoading(false)
    }

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left Side - Welcome Content */}
                <div className="hidden lg:block space-y-6">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                            Join Kaam247 Today!
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                            Start connecting with local helpers or earn by helping others. Create your account in seconds.
                        </p>
                    </div>
                    
                    <div className="space-y-4 pt-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Earn Extra Income</h3>
                                <p className="text-gray-600 dark:text-gray-400">Set your own rates and work on your schedule</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Direct Communication</h3>
                                <p className="text-gray-600 dark:text-gray-400">Talk directly with helpers, no middlemen</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Build Your Reputation</h3>
                                <p className="text-gray-600 dark:text-gray-400">Get rated and build trust in your community</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Register Form */}
                <div className="w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 sm:p-8 lg:p-10 border border-gray-100 dark:border-gray-700">
                        <div className="text-center mb-8">
                            <div className="lg:hidden mb-4">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    Join Kaam247 Today!
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Create your account to get started
                                </p>
                            </div>
                            <div className="hidden lg:block">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    Create Account
                                </h1>
                            </div>
                        </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="Enter your phone number"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Enter your email"
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
                            minLength={6}
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
                                    Creating account...
                                </span>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            By signing up, you agree to{' '}
                            <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                Terms
                            </Link>
                            {' '}&{' '}
                            <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                Privacy
                            </Link>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register
