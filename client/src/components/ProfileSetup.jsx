import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function ProfileSetup({ onComplete }) {
    const { completeProfileSetup } = useAuth()
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!formData.name || formData.name.trim().length === 0) {
            setError('Name is required')
            return
        }

        if (formData.name.trim().length < 2) {
            setError('Name must be at least 2 characters long')
            return
        }

        // Email validation (optional but if provided, should be valid)
        if (formData.email && formData.email.trim().length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email.trim())) {
                setError('Please enter a valid email address')
                return
            }
        }

        setIsLoading(true)

        const result = await completeProfileSetup(
            formData.name.trim(),
            formData.email.trim() || undefined
        )

        if (result.success) {
            onComplete()
        } else {
            setError(result.error || 'Failed to complete profile setup')
        }

        setIsLoading(false)
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Complete Your Profile
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Add a few details to get started
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base"
                            required
                            minLength={2}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address <span className="text-gray-500 dark:text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Enter your email (optional)"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            We'll use this for important notifications
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !formData.name.trim()}
                        className={`w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-base min-h-[48px] ${
                            isLoading || !formData.name.trim()
                                ? 'bg-blue-400 dark:bg-blue-600 cursor-not-allowed'
                                : 'hover:bg-blue-700 dark:hover:bg-blue-600'
                        }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Setting up...
                            </span>
                        ) : (
                            'Complete Setup'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ProfileSetup
