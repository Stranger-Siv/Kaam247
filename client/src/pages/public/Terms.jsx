import { Link } from 'react-router-dom'

function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6 inline-block"
        >
          ← Back to Kaam247
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Last updated: Pilot phase. This is a placeholder. Replace with your actual Terms of Service before launch.
        </p>
        <div className="prose prose-slate dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm sm:text-base space-y-4">
          <p>
            By using Kaam247 you agree to use the service responsibly, to provide accurate information, and to treat other users with respect. Task posters and workers are responsible for their own conduct and transactions.
          </p>
          <p>
            We reserve the right to suspend or remove accounts that violate our policies. For the full terms, contact us or check back here after the pilot.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Terms
