import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/env'

function SetupProfile() {
  const navigate = useNavigate()
  const { user, updateUserInContext } = useAuth()
  const [formData, setFormData] = useState({
    name: (user?.name || '').trim(),
    phone: (user?.phone || '').trim()
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError('')
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const errors = {}
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = 'Name is required'
    }
    const digits = (formData.phone || '').replace(/\D/g, '')
    if (digits.length !== 10) {
      errors.phone = 'Enter a valid 10-digit mobile number'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/auth/profile-setup`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim().replace(/\D/g, '')
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save profile')
      }

      updateUserInContext(data.user)
      if (data.user?.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left side – welcome (matches Login / Register) */}
        <div className="hidden lg:block space-y-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
              Almost there!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              You signed in with Google. Add your name and mobile number so others can reach you and you can use Kaam247.
            </p>
          </div>

          <div className="space-y-4 pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Display name</h3>
                <p className="text-gray-600 dark:text-gray-400">How you’ll appear to posters and workers</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">10-digit mobile</h3>
                <p className="text-gray-600 dark:text-gray-400">Required for local task matching and contact</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Quick & secure</h3>
                <p className="text-gray-600 dark:text-gray-400">Takes a moment; we don’t share your number</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side – form (same card style as Login / Register) */}
        <div className="w-full flex justify-center lg:justify-end">
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-6 sm:p-8 lg:p-10 border border-gray-100 dark:border-gray-700">
              {/* Brand + title – mobile shows title, desktop matches Login */}
              <div className="text-center mb-8">
                <Link to="/" className="inline-flex items-center gap-2 mb-6">
                  <img src="/logo.svg" alt="Kaam247" className="h-9 w-auto object-contain" />
                  <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kaam247</span>
                </Link>
                <div className="lg:hidden mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Almost there!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add your name and mobile to get started
                  </p>
                </div>
                <div className="hidden lg:block">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Complete your profile
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Name and 10-digit mobile number
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base ${fieldErrors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    autoComplete="name"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base ${fieldErrors.phone ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    autoComplete="tel"
                    maxLength={10}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{fieldErrors.phone}</p>
                  )}
                </div>

                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-base min-h-[48px] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 dark:hover:bg-blue-600'}`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Saving...
                    </span>
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                You signed in with Google. This step completes your Kaam247 profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SetupProfile
