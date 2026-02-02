/**
 * Full-page loading fallback for Suspense (route changes / lazy chunks).
 * Uses skeleton layout and app background so the UI doesn’t flash white.
 */
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col">
      {/* Skeleton header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-20 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-9 w-9 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Skeleton main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {/* Page title skeleton */}
        <div className="mb-6">
          <div className="h-8 w-48 sm:w-64 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
          <div className="h-4 w-full max-w-md rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>

        {/* Card skeletons */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-4 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
            <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Subtle loading indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span>Loading…</span>
        </div>
      </main>
    </div>
  )
}

export default PageLoader
