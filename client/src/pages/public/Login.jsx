import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

function Login() {
    const navigate = useNavigate()
    const { login, isAuthenticated } = useAuth()

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

    return (
        <div className="max-w-md mx-auto px-2 sm:px-6 lg:px-8 py-12 sm:py-16 w-full overflow-x-hidden">
            <div className="bg-white rounded-none sm:rounded-xl shadow-sm p-6 sm:p-8 lg:p-10 border-0 sm:border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Login
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email / Phone
                        </label>
                        <input
                            type="text"
                            value={formData.identifier}
                            onChange={(e) => handleInputChange('identifier', e.target.value)}
                            placeholder="Enter your email or phone"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder="Enter your password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg transition-colors text-base min-h-[48px] ${
                            isLoading 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'hover:bg-blue-700'
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

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
