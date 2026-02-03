import { Link } from 'react-router-dom'

function Privacy() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Last updated: Pilot phase. This is a placeholder. Replace with your actual Privacy Policy before launch.
        </p>
        <div className="prose prose-slate dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm sm:text-base space-y-4">
          <p>
            Kaam247 collects the information you provide (e.g. phone, name, location when you use the app) to run the service, match tasks, and communicate with you. We do not sell your data to third parties.
          </p>
          <p>
            Data is stored securely and used only to operate Kaam247. You can request a copy of your data or account deletion via Settings → Account. For the full policy, contact us or check back here after the pilot.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Privacy
