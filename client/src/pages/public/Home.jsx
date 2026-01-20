import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Home() {
    const { isAuthenticated } = useAuth()

    const categories = [
        { name: 'Cleaning', icon: '🧹' },
        { name: 'Delivery', icon: '📦' },
        { name: 'Helper / Labour', icon: '👷' },
        { name: 'Tutor', icon: '📚' },
        { name: 'Tech Help', icon: '💻' },
        { name: 'Errands', icon: '🏃' },
        { name: 'Event Help', icon: '🎉' },
        { name: 'Custom Task', icon: '✨' },
    ]

    return (
        <div className="bg-white dark:bg-gray-950">
            {/* HERO SECTION */}
            <section className="bg-white dark:bg-gray-950 py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-5 lg:mb-6 leading-tight tracking-tight">
                        Get local help for everyday tasks — fast.
                    </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 lg:mb-12 max-w-2xl mx-auto leading-relaxed">
                        Post a task or earn by helping nearby people. No agencies. No delays.
                    </p>

                    {/* Primary CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
                        <Link
                            to={isAuthenticated ? "/post-task" : "/login"}
                            className="px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-4.5 bg-blue-600 dark:bg-blue-500 text-white text-base sm:text-lg font-semibold rounded-xl shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg transition-all duration-200 active:scale-[0.98] min-h-[48px] sm:min-h-[52px] flex items-center justify-center touch-manipulation"
                        >
                            Post a Task
                        </Link>
                        <Link
                            to={isAuthenticated ? "/tasks" : "/login"}
                            className="px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-4.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-base sm:text-lg font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 active:scale-[0.98] min-h-[48px] sm:min-h-[52px] flex items-center justify-center touch-manipulation"
                        >
                            Find Work Nearby
                        </Link>
                    </div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section className="bg-gray-50 dark:bg-gray-900 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                        {categories.map((category) => (
                            <div
                                key={category.name}
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 lg:p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 text-center group"
                            >
                                <span className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3 block group-hover:scale-110 transition-transform duration-200">{category.icon}</span>
                                <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 leading-tight block">
                                    {category.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="bg-white dark:bg-gray-950 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10 sm:mb-12 lg:mb-16">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 leading-tight">
                            How Kaam247 Works
                        </h2>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            Real people. Real tasks. Nearby help — in minutes.
                        </p>
                    </div>

                    <div className="space-y-8 sm:space-y-10 lg:space-y-12">
                        {/* Task Poster Section */}
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-7 lg:mb-8">
                                <span className="text-2xl sm:text-3xl lg:text-4xl flex-shrink-0">👤</span>
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                    If you need help (Task Poster)
                                </h3>
                            </div>
                            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm sm:text-base">1</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Post what you need done</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                                            Describe the task, set your budget, choose location and time.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm sm:text-base">2</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Nearby helpers get notified</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Only people close to you see the task — no agencies, no spam.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm sm:text-base">3</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Get the work done</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Connect directly, complete the task, and mark it done.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Worker Section */}
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-7 lg:mb-8">
                                <span className="text-2xl sm:text-3xl lg:text-4xl flex-shrink-0">🧑‍🔧</span>
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                    If you want to earn (Worker)
                                </h3>
                            </div>
                            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 dark:text-green-400 font-bold text-sm sm:text-base">1</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Go online when you're available</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Turn on availability to receive nearby task alerts.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 dark:text-green-400 font-bold text-sm sm:text-base">2</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Accept tasks you want to do</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Choose tasks that match your skills, time, and distance.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 dark:text-green-400 font-bold text-sm sm:text-base">3</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Complete & get rated</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Finish the task, build your profile, and get more work.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trust Points */}
                    <div className="mt-10 sm:mt-12 lg:mt-16 pt-8 sm:pt-10 lg:pt-12 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
                            <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                                <span className="text-xl sm:text-2xl lg:text-3xl">✔</span>
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 leading-tight">Verified users</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                                <span className="text-xl sm:text-2xl lg:text-3xl">✔</span>
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 leading-tight">Direct contact</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                                <span className="text-xl sm:text-2xl lg:text-3xl">✔</span>
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 leading-tight">Hyperlocal matching</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                                <span className="text-xl sm:text-2xl lg:text-3xl">✔</span>
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 dark:text-gray-300 leading-tight">Safe & reliable</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BENEFITS SECTION */}
            <section className="bg-gray-50 dark:bg-gray-900 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-10 sm:mb-12 lg:mb-16">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 leading-tight">
                            Why Choose Kaam247?
                        </h2>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                            The fastest way to connect with local helpers and get things done
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* Benefit 1 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Lightning Fast</h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                Get matched with nearby helpers in minutes, not days. No waiting, no delays.
                            </p>
                        </div>

                        {/* Benefit 2 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Fair Pricing</h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                Set your own budget. Workers set their rates. No hidden fees or commissions.
                            </p>
                        </div>

                        {/* Benefit 3 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Hyperlocal</h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                Connect with people in your neighborhood. Real help, right around the corner.
                            </p>
                        </div>

                        {/* Benefit 4 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Safe & Secure</h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                Verified users, secure payments, and built-in safety features for peace of mind.
                            </p>
                        </div>

                        {/* Benefit 5 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Direct Communication</h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                Talk directly with helpers. No middlemen, no agencies. Just real conversations.
                            </p>
                        </div>

                        {/* Benefit 6 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Rating System</h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                                Build trust through ratings and reviews. Quality work gets recognized and rewarded.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="bg-white dark:bg-gray-950 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">100+</div>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">Active Users</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-600 dark:text-green-400 mb-2">500+</div>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">Tasks Completed</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">8+</div>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">Task Categories</p>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">4.8★</div>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium">Average Rating</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-5 leading-tight">
                        Ready to get started?
                    </h2>
                    <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
                        Join thousands of people using Kaam247 to get things done and earn extra income.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
                        <Link
                            to={isAuthenticated ? "/post-task" : "/register"}
                            className="px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-4.5 bg-white text-blue-600 text-base sm:text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-50 hover:shadow-xl transition-all duration-200 active:scale-[0.98] min-h-[48px] sm:min-h-[52px] flex items-center justify-center touch-manipulation"
                        >
                            Get Started Now
                        </Link>
                        <Link
                            to={isAuthenticated ? "/tasks" : "/login"}
                            className="px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-4.5 bg-blue-500 text-white text-base sm:text-lg font-semibold rounded-xl border-2 border-blue-400 shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all duration-200 active:scale-[0.98] min-h-[48px] sm:min-h-[52px] flex items-center justify-center touch-manipulation"
                        >
                            Browse Tasks
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    )
}

export default Home
