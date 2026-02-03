import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config/env'

export default function SettingsDataExport() {
  const { user } = useAuth()
  const [csvDateFrom, setCsvDateFrom] = useState('')
  const [csvDateTo, setCsvDateTo] = useState('')
  const [csvDownloading, setCsvDownloading] = useState(false)

  const handleDownloadActivityCsv = async () => {
    if (!user?.id) return
    setCsvDownloading(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const params = new URLSearchParams({ export: 'csv' })
      if (csvDateFrom) params.set('dateFrom', csvDateFrom)
      if (csvDateTo) params.set('dateTo', csvDateTo)
      const res = await fetch(`${API_BASE_URL}/api/users/me/activity?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'activity.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      // ignore
    } finally {
      setCsvDownloading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          ← Back to Settings
        </Link>
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
        Data & export
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Download your activity (posted, accepted, completed, cancelled tasks) as a CSV file. Optionally set a date range.
      </p>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600 dark:text-gray-400">From</span>
            <input
              type="date"
              value={csvDateFrom}
              onChange={(e) => setCsvDateFrom(e.target.value)}
              className="h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600 dark:text-gray-400">To</span>
            <input
              type="date"
              value={csvDateTo}
              onChange={(e) => setCsvDateTo(e.target.value)}
              className="h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handleDownloadActivityCsv}
            disabled={csvDownloading}
            className="h-10 px-4 bg-green-600 dark:bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
          >
            {csvDownloading ? 'Downloading...' : 'Download activity CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}
