import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'

function AdminFeedback() {
  const [profileFeedback, setProfileFeedback] = useState([])
  const [onboardingFeedback, setOnboardingFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'onboarding'

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch feedback')
      const data = await response.json()
      setProfileFeedback(data.profileFeedback || [])
      setOnboardingFeedback(data.onboardingFeedback || [])
    } catch (err) {
      setError(err.message || 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—')

  if (loading) {
    return (
      <div className="w-full overflow-x-hidden">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2 animate-pulse" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-56 animate-pulse" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight">
          Feedback
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Onboarding feedback and profile suggestions from users.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          Profile feedback ({profileFeedback.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('onboarding')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'onboarding'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
        >
          Onboarding feedback ({onboardingFeedback.length})
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile & suggestions</h2>
          {profileFeedback.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No profile feedback yet.</p>
            </div>
          ) : (
            profileFeedback.map((f) => (
              <div
                key={f._id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    {f.user && (
                      <Link
                        to={`/admin/users/${f.user._id}`}
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {f.user.name || '—'}
                      </Link>
                    )}
                    {f.user?.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{f.user.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {f.rating != null && (
                      <span className="text-sm text-amber-600 dark:text-amber-400">{f.rating}/5</span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(f.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{f.text}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Onboarding (first-time) feedback</h2>
          {onboardingFeedback.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No onboarding feedback yet.</p>
            </div>
          ) : (
            onboardingFeedback.map((f, i) => (
              <div
                key={f.userId || i}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/users/${f.userId}`}
                      className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {f.name || '—'}
                    </Link>
                    {(f.email || f.phone) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{[f.email, f.phone].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(f.submittedAt)}</span>
                </div>
                {f.useCase && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">What they want to use Kaam247 for</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{f.useCase}</p>
                  </div>
                )}
                {f.suggestions && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Suggestions / expectations</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{f.suggestions}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default AdminFeedback
