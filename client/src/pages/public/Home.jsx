import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config/env'

const initialStats = {
  totalUsers: 0,
  totalCompletedTasks: 0,
  categoryCount: 0,
  averageRating: 0,
}

function Home() {
  const { isAuthenticated } = useAuth()
  const [stats, setStats] = useState(initialStats)
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
            averageRating: data.averageRating ?? 0,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setStats(initialStats)
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })

    return () => {
      cancelled = true
    }
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
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-gray-950 dark:to-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-5 lg:mb-6 leading-tight tracking-tight">
              Get local help for everyday tasks — fast.
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-9 lg:mb-11 max-w-2xl mx-auto leading-relaxed">
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

            {/* small trust strip */}
            <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✔</span> Hyperlocal matching
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✔</span> Direct contact
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✔</span> Ratings system
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHAT IS KAAM247? */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
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
                className="group bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-center"
              >
                <span className="text-3xl sm:text-4xl mb-2 sm:mb-3 block transition-transform duration-200 group-hover:scale-[1.06]">
                  {category.icon}
                </span>
                <span className="text-xs sm:text-sm lg:text-base font-semibold text-gray-800 dark:text-gray-100 leading-tight block">
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

      {/* SECTION 3: HOW IT WORKS */}
      <section className="bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800">
        <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
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
              {/* Posters */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 sm:p-6 lg:p-7 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
                    <span className="text-2xl sm:text-3xl">👥</span>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                    For Task Posters
                  </h3>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  {[
                    'Post your task with budget & location',
                    'Nearby helpers see it and accept',
                    'Get the work done and mark it complete',
                  ].map((text, idx) => (
                    <div
                      key={text}
                      className={`flex items-start gap-3 ${idx !== 2 ? 'pb-4 border-b border-gray-100 dark:border-gray-800' : ''}`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">
                          {idx + 1}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workers */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 sm:p-6 lg:p-7 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
                    <span className="text-2xl sm:text-3xl">🧑‍🔧</span>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                    For Workers
                  </h3>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  {[
                    'Go online when you’re free',
                    'Accept nearby tasks that suit you',
                    'Complete the task & earn',
                  ].map((text, idx) => (
                    <div
                      key={text}
                      className={`flex items-start gap-3 ${idx !== 2 ? 'pb-4 border-b border-gray-100 dark:border-gray-800' : ''}`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-300">
                          {idx + 1}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA strip */}
            <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 sm:px-6 py-5 shadow-sm">
              <div>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                  Ready to get started?
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Post a task in under a minute, or start earning nearby.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  to={isAuthenticated ? '/post-task' : '/login'}
                  className="px-5 py-3 bg-blue-600 dark:bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                >
                  Post a Task
                </Link>
                <Link
                  to={isAuthenticated ? '/tasks' : '/login'}
                  className="px-5 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm sm:text-base font-semibold rounded-xl border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  Browse Tasks
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: WHY KAAM247? */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
              Why Kaam247?
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Built for speed, trust, and local reliability — without middlemen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                title: 'Hyperlocal only',
                desc: 'Tasks are matched with people nearby — made for your area, not the entire city.',
              },
              {
                title: 'Direct contact',
                desc: 'Talk directly with the other person. No agencies or call centers in the middle.',
              },
              {
                title: 'Verified users',
                desc: 'Accounts go through checks so you know who you are dealing with.',
              },
              {
                title: 'Transparent tasks & budgets',
                desc: 'See task details and budget clearly before you decide.',
              },
              {
                title: 'You control when you work',
                desc: 'Go online only when you are free. No shifts, no fixed hours, no forced commitments.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                  {item.title}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: SAFETY & CONTROL */}
      <section className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight">
                Safety & control built in
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                You’re always in control of who you work with and what you accept.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-7">
              <div className="space-y-4 sm:space-y-5">
                {[
                  'You choose who you work with or who you hire — nothing is auto-assigned.',
                  'Tasks can be cancelled if something changes.',
                  'Ratings after each task help good posters and good workers stand out.',
                  'Location-based matching means you are not pulled into far away or unsafe areas.',
                  'No long-term contracts. Use Kaam247 only when you need it.',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg sm:text-xl text-green-600 dark:text-green-400">
                      ✔
                    </span>
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 leading-relaxed">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: REAL NUMBERS */}
      <section className="hidden md:block bg-white dark:bg-gray-950 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Kaam247 in numbers
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Real platform metrics — updated automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                label: 'Total users',
                value: statsLoading ? '—' : stats.totalUsers.toLocaleString(),
                delay: '0ms',
              },
              {
                label: 'Tasks completed',
                value: statsLoading ? '—' : stats.totalCompletedTasks.toLocaleString(),
                delay: '80ms',
              },
              {
                label: 'Task categories',
                value: statsLoading ? '—' : stats.categoryCount,
                delay: '160ms',
              },
              {
                label: 'Avg. rating',
                value:
                  statsLoading
                    ? '—'
                    : stats.averageRating > 0
                    ? stats.averageRating.toFixed(1)
                    : '—',
                delay: '240ms',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-5 flex flex-col items-center justify-center text-center"
              >
                <span
                  className={`text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight ${
                    !statsLoading ? 'animate-stat-pop' : ''
                  }`}
                  style={!statsLoading ? { animationDelay: item.delay } : undefined}
                >
                  {item.value}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
