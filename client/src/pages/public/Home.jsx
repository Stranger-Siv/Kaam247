import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config/env'

function Home() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompletedTasks: 0,
    categoryCount: 0,
    averageRating: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE_URL}/api/stats`, { credentials: 'omit' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (!cancelled) {
          setStats({
            totalUsers: data.totalUsers ?? 0,
            totalCompletedTasks: data.totalCompletedTasks ?? 0,
            categoryCount: data.categoryCount ?? 0,
            averageRating: data.averageRating ?? 0
          })
        }
      })
      .catch(() => {
        if (!cancelled) setStats({ totalUsers: 0, totalCompletedTasks: 0, categoryCount: 0, averageRating: 0 })
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const categories = [
    { name: 'Cleaning', icon: '🧹' },
    { name: 'Delivery', icon: '📦' },
    { name: 'Helper / Labour', icon: '👷' },
    { name: 'Moving help', icon: '🚚' },
    { name: 'Tech help', icon: '💻' },
    { name: 'Tutoring', icon: '📚' },
    { name: 'Errands', icon: '🏃' },
    {
      name: 'Custom Task',
      icon: '✨',
      description: 'Anything else you need help with',
    },
  ]

  return (
    <div className="bg-slate-50 dark:bg-gray-950">
      {/* SECTION 1: HERO */}
      <section className="bg-gradient-to-b from-white to-slate-50 dark:from-gray-950 dark:to-gray-950 border-b border-gray-100 dark:border-gray-800 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-5 lg:mb-6 leading-tight tracking-tight">
            Get local help for everyday tasks — fast.
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-7 sm:mb-8 lg:mb-10 max-w-2xl mx-auto leading-relaxed">
            Post a task or earn money by helping people nearby. No agencies. No delays.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
            <Link
              to={isAuthenticated ? '/post-task' : '/login'}
              className="px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 bg-blue-600 dark:bg-blue-500 text-white text-base sm:text-lg font-semibold rounded-xl shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg transition-all duration-200 active:scale-[0.98] min-h-[48px] sm:min-h-[52px] flex items-center justify-center"
            >
              Post a Task
            </Link>
            <Link
              to={isAuthenticated ? '/tasks' : '/login'}
              className="px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-base sm:text-lg font-semibold rounded-xl border border-gray-300 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md transition-all duration-200 active:scale-[0.98] min-h-[48px] sm:min-h-[52px] flex items-center justify-center"
            >
              Find Work Nearby
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHAT IS KAAM247? */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
              What is Kaam247?
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Kaam247 is a hyperlocal task marketplace that connects people who need help with nearby people who can do the work.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {categories.map((category) => (
              <div
                key={category.name}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 text-center"
              >
                <span className="text-3xl sm:text-4xl mb-2 sm:mb-3 block">{category.icon}</span>
                <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-800 dark:text-gray-100 leading-tight block">
                  {category.name}
                </span>
                {category.description && (
                  <span className="mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-300 leading-snug block">
                    {category.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS (DUAL FLOW) */}
      <section className="bg-white dark:bg-gray-950 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
              How it works
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Two simple paths — one for people who need help, one for people who want to earn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* LEFT: Task posters */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-7 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                <span className="text-2xl sm:text-3xl flex-shrink-0">👥</span>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  For Task Posters
                </h3>
              </div>
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                      Post your task with budget & location
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                      Nearby helpers see it and accept
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-3">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                      Get the work done and mark it complete
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Workers */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-7 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                <span className="text-2xl sm:text-3xl flex-shrink-0">🧑‍🔧</span>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  For Workers
                </h3>
              </div>
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-300">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                      Go online when you’re free
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-300">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                      Accept nearby tasks that suit you
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pt-3">
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-300">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                      Complete the task & earn
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: WHY KAAM247? */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
              Why Kaam247?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                Hyperlocal only
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Tasks are matched with people nearby — made for your area, not the entire city.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                Direct contact
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Talk directly with the other person. No agencies or call centers in the middle.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                Verified users
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Accounts go through checks so you know who you are dealing with.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                Transparent tasks & budgets
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                See task details and budget clearly before you decide.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                You control when you work
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                Go online only when you are free. No shifts, no fixed hours, no forced commitments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: SAFETY & CONTROL */}
      <section className="bg-white dark:bg-gray-950 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
              Safety & control built in
            </h2>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg sm:text-xl text-green-600 dark:text-green-400">✔</span>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200">
                You choose who you work with or who you hire — nothing is auto-assigned.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg sm:text-xl text-green-600 dark:text-green-400">✔</span>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200">
                Tasks can be cancelled if something changes.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg sm:text-xl text-green-600 dark:text-green-400">✔</span>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200">
                Ratings after each task help good posters and good workers stand out.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg sm:text-xl text-green-600 dark:text-green-400">✔</span>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200">
                Location-based matching means you are not pulled into far away or unsafe areas.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-lg sm:text-xl text-green-600 dark:text-green-400">✔</span>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200">
                No long-term contracts. Use Kaam247 only when you need it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: REAL NUMBERS */}
      <section className="bg-white dark:bg-gray-950 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
            <div className="flex flex-col items-center justify-center py-6 lg:py-4 xl:py-6 first:pt-0 last:pb-0 lg:first:pt-4 lg:last:pb-4 xl:first:pl-0 xl:last:pr-0">
              <span
                className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight ${!statsLoading ? 'animate-stat-pop' : ''}`}
                style={!statsLoading ? { animationDelay: '0ms' } : undefined}
              >
                {statsLoading ? '—' : stats.totalUsers.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Total users</span>
            </div>
            <div className="flex flex-col items-center justify-center py-6 lg:py-4 xl:py-6">
              <span
                className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight ${!statsLoading ? 'animate-stat-pop' : ''}`}
                style={!statsLoading ? { animationDelay: '80ms' } : undefined}
              >
                {statsLoading ? '—' : stats.totalCompletedTasks.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Tasks completed</span>
            </div>
            <div className="flex flex-col items-center justify-center py-6 lg:py-4 xl:py-6">
              <span
                className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight ${!statsLoading ? 'animate-stat-pop' : ''}`}
                style={!statsLoading ? { animationDelay: '160ms' } : undefined}
              >
                {statsLoading ? '—' : stats.categoryCount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Task categories</span>
            </div>
            <div className="flex flex-col items-center justify-center py-6 lg:py-4 xl:py-6">
              <span
                className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight ${!statsLoading ? 'animate-stat-pop' : ''}`}
                style={!statsLoading ? { animationDelay: '240ms' } : undefined}
              >
                {statsLoading ? '—' : (stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">Avg. rating</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

